package com.edgemart;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.edgemart.commerce.*;
import com.edgemart.config.*;
import jakarta.servlet.http.*;
import java.util.Map;
import java.nio.file.Path;
import org.junit.jupiter.api.*;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;
import org.springframework.core.env.Environment;
import org.springframework.mock.web.*;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.test.context.support.TestPropertySourceUtils;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

class SecurityConfigTest {
  AnnotationConfigWebApplicationContext context;
  MockMvc mvc;

  @BeforeEach
  void setup() {
    context = new AnnotationConfigWebApplicationContext();
    context.setServletContext(new MockServletContext());
    TestPropertySourceUtils.addInlinedPropertiesToEnvironment(context,
        "edgemart.backend-url=http://localhost:8081",
        "server.servlet.session.cookie.secure=false",
        "server.servlet.session.cookie.same-site=lax",
        "edgemart.allowed-origins=http://localhost:5173, https://shop.example.test");
    context.register(TestConfig.class);
    context.refresh();
    mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
  }

  @AfterEach
  void teardown() {
    SecurityContextHolder.clearContext();
    context.close();
  }

  @Test
  void consentPolicyPagesAndTheirStylesAreReadableWithoutSigningIn() throws Exception {
    mvc.perform(get("/privacy.html")).andExpect(status().isOk())
        .andExpect(content().string(org.hamcrest.Matchers.containsString("Google &amp; GitHub sign-in")));
    mvc.perform(get("/terms.html")).andExpect(status().isOk())
        .andExpect(content().string(org.hamcrest.Matchers.containsString("Terms of service")));
    mvc.perform(get("/assets/policy.css")).andExpect(status().isOk());
    mvc.perform(get("/private-policy.html")).andExpect(status().isUnauthorized());
  }

  @Test
  void anonymousSessionReturnsUsableCsrfToken() throws Exception {
    mvc.perform(get("/auth/session"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.csrfToken").isNotEmpty());
  }

  @Test
  void configuredOriginsCanPreflightTheFrontendCsrfHeader() throws Exception {
    for (String origin : new String[] {"http://localhost:5173", "https://shop.example.test"}) {
      mvc.perform(options("/auth/login").header("Origin", origin)
              .header("Access-Control-Request-Method", "POST")
              .header("Access-Control-Request-Headers", "content-type,x-csrf-token"))
          .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", origin))
          .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }
    mvc.perform(options("/auth/login").header("Origin", "https://untrusted.example.test")
            .header("Access-Control-Request-Method", "POST"))
        .andExpect(status().isForbidden());
  }

  @Test
  void mutationsRequireTheSessionCsrfToken() throws Exception {
    mvc.perform(post("/api/contact").contentType("application/json").content("{}"))
        .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("CSRF_EXPIRED"));
    MvcResult bootstrap = mvc.perform(get("/auth/session")).andReturn();
    MockHttpSession session = (MockHttpSession) bootstrap.getRequest().getSession();
    CsrfToken csrf = (CsrfToken) bootstrap.getRequest().getAttribute(CsrfToken.class.getName());
    mvc.perform(post("/auth/login").session(session)).andExpect(status().isForbidden());
    mvc.perform(post("/auth/login").session(session).header("X-CSRF-Token", "wrong"))
        .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("CSRF_EXPIRED"));
    mvc.perform(post("/auth/login").session(session).header("X-CSRF-Token", csrf.getToken())
            .contentType("application/json").content("{}"))
        .andExpect(status().isOk());
  }

  @Test
  void signinPersistsAccountIdentityVersionAndRotatesSessionId() throws Exception {
    MvcResult bootstrap = mvc.perform(get("/auth/session")).andReturn();
    MockHttpSession session = (MockHttpSession) bootstrap.getRequest().getSession();
    String previousId = session.getId();
    CsrfToken csrf = (CsrfToken) bootstrap.getRequest().getAttribute(CsrfToken.class.getName());
    mvc.perform(post("/auth/login").session(session).header("X-CSRF-Token", csrf.getToken())
            .contentType("application/json").content("{}"))
        .andExpect(status().isOk());
    assertNotEquals(previousId, session.getId());
    assertEquals("account-test", session.getAttribute("accountId"));
    assertEquals(7L, session.getAttribute("accountVersion"));
    SecurityContext saved = (SecurityContext) session.getAttribute(
        HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);
    assertEquals("account-test", saved.getAuthentication().getName());
    assertEquals("ROLE_DRIVER", saved.getAuthentication().getAuthorities().iterator().next().getAuthority());
    mvc.perform(get("/auth/session").session(session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.user.id").value("account-test"));
  }

  @Test
  void signupRequiresLoginAndRemovedRoutesReturnNotFound() throws Exception {
    MvcResult bootstrap = mvc.perform(get("/auth/session")).andReturn();
    MockHttpSession session = (MockHttpSession) bootstrap.getRequest().getSession();
    CsrfToken csrf = (CsrfToken) bootstrap.getRequest().getAttribute(CsrfToken.class.getName());
    mvc.perform(post("/auth/signup").session(session).header("X-CSRF-Token", csrf.getToken())
            .contentType("application/json").content("{\"email\":\"new@example.test\"}"))
        .andExpect(status().isOk()).andExpect(jsonPath("$.user.email").value("new@example.test"))
        .andExpect(jsonPath("$.user.emailVerified").doesNotExist())
        .andExpect(jsonPath("$.verificationRequired").doesNotExist());
    assertNull(session.getAttribute("accountId"));
    mvc.perform(get("/auth/session").session(session))
        .andExpect(status().isOk()).andExpect(jsonPath("$.user").isEmpty());
    for (String route : new String[] {"/auth/email/verify", "/auth/email/resend", "/auth/password/forgot", "/auth/password/reset"}) {
      mvc.perform(post(route).session(session).header("X-CSRF-Token", csrf.getToken())
              .contentType("application/json").content("{}"))
          .andExpect(status().isNotFound());
    }
    mvc.perform(get("/auth/dev/inbox").session(session)).andExpect(status().isNotFound());
  }

  @TestConfiguration
  @EnableWebMvc
  @Import({SecurityConfig.class, CorsConfig.class})
  static class TestConfig implements WebMvcConfigurer {
    @Override public void addResourceHandlers(ResourceHandlerRegistry registry) {
      registry.addResourceHandler("/privacy.html", "/terms.html", "/assets/policy.css")
          .addResourceLocations(Path.of("../frontend/public").toAbsolutePath().toUri().toString());
    }
    @Bean OAuthRegistrations providers(Environment env) { return new OAuthRegistrations(env); }
    @Bean OAuthSuccess oauth(AccountService accounts, HttpSessionSecurityContextRepository repository) {
      return new OAuthSuccess(accounts, "http://localhost:5173", repository, null);
    }
    @Bean AccountService accounts() { return new TestAccounts(); }
    @Bean AuthController controller(AccountService accounts, OAuthRegistrations providers,
        OAuthSuccess oauth, HttpSessionSecurityContextRepository repository) {
      return new AuthController(accounts, new RegistrationService(accounts,null), providers, oauth, repository, "http://localhost:8081");
    }
  }

  // Exercise the real controller and filters with account persistence supplied in memory.
  static class TestAccounts extends AccountService {
    Account saved;
    TestAccounts() { super(null, new RateLimiter()); }
    @Override public Account signup(Map<String, Object> values, String ip) {
      return account("buyer", (String) values.get("email"));
    }
    @Override public Account login(Map<String, Object> values, String ip) {
      return account("driver", "test@example.test");
    }
    @Override public Account current(HttpServletRequest request) {
      if (saved == null || request.getSession(false) == null
          || !saved.id.equals(request.getSession().getAttribute("accountId")))
        throw new ApiException(401, "SESSION_EXPIRED", "Sign in to continue.");
      return saved;
    }
    Account account(String role, String email) {
      Account account = new Account();
      account.id = "account-test";
      account.email = email;
      account.role = role;
      account.sessionVersion = 7;
      saved = account;
      return saved;
    }
  }
}
