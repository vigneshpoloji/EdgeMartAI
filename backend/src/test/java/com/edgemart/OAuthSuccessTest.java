package com.edgemart;

import static org.junit.jupiter.api.Assertions.*;
import com.edgemart.commerce.*;
import com.edgemart.config.OAuthSuccess;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.mock.web.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;

class OAuthSuccessTest {
  Account account = new Account();
  int oauthCalls;
  ApiException oauthFailure;
  Account linkedAccount;
  AccountService accounts = new AccountService(null,new RateLimiter()){
    @Override public Account oauth(String identity,String email,String name,Account linking){oauthCalls++;linkedAccount=linking;if(oauthFailure!=null)throw oauthFailure;return account;}
    @Override public Account current(jakarta.servlet.http.HttpServletRequest request){if(request.getSession(false)==null||!account.id.equals(request.getSession().getAttribute("accountId")))throw new ApiException(401,"SESSION_EXPIRED","Sign in again.");return account;}
  };
  OAuthSuccess handler = new OAuthSuccess(accounts,"http://localhost:5173",new HttpSessionSecurityContextRepository(),null);
  @BeforeEach void setup(){account.id="customer";account.email="person@example.test";account.name="Person";}
  @AfterEach void cleanup(){SecurityContextHolder.clearContext();}
  OAuth2AuthenticationToken google(boolean verified){return new OAuth2AuthenticationToken(new DefaultOAuth2User(List.of(new SimpleGrantedAuthority("ROLE_USER")),Map.of("sub","subject","email",account.email,"name",account.name,"email_verified",verified),"sub"),List.of(new SimpleGrantedAuthority("ROLE_USER")),"google");}
  @Test void socialSignupReturnsToLoginAndPreservesIndependentDriverSession() throws Exception {
    var request=new MockHttpServletRequest();var response=new MockHttpServletResponse();
    request.getSession().setAttribute("oauthMode","signup");request.getSession().setAttribute("oauthReturnTo","http://localhost:5173/?department=books");request.getSession().setAttribute("driverAccountId","driver");
    handler.onAuthenticationSuccess(request,response,google(true));
    assertTrue(response.getRedirectedUrl().startsWith("http://localhost:5173/?auth=login&registered=1&returnTo="));
    assertNull(request.getSession().getAttribute("accountId"));assertNull(request.getSession().getAttribute("SPRING_SECURITY_CONTEXT"));assertEquals("driver",request.getSession().getAttribute("driverAccountId"));
  }
  @Test void sellerSocialSignupReturnsToSellerLogin() throws Exception {
    var request=new MockHttpServletRequest();var response=new MockHttpServletResponse();
    request.getSession().setAttribute("oauthMode","signup");request.getSession().setAttribute("oauthReturnTo","http://localhost:5173/?seller=signup&department=books");
    handler.onAuthenticationSuccess(request,response,google(true));
    assertEquals("http://localhost:5173/?seller=login&department=books&registered=1",response.getRedirectedUrl());assertNull(request.getSession().getAttribute("accountId"));
  }
  @Test void socialLoginStartsDashboardSession() throws Exception {
    var request=new MockHttpServletRequest();var response=new MockHttpServletResponse();
    request.getSession().setAttribute("oauthMode","login");request.getSession().setAttribute("oauthReturnTo","http://localhost:5173/?department=books");
    handler.onAuthenticationSuccess(request,response,google(true));
    assertEquals("customer",request.getSession().getAttribute("accountId"));assertEquals("http://localhost:5173/?department=books",response.getRedirectedUrl());assertNull(request.getSession().getAttribute("oauthMode"));
  }
  @Test void unverifiedProviderEmailCannotCreateAccountOrEraseExistingSessions() throws Exception {
    var request=new MockHttpServletRequest();var response=new MockHttpServletResponse();
    request.getSession().setAttribute("accountId",account.id);request.getSession().setAttribute("driverAccountId","driver");
    handler.onAuthenticationSuccess(request,response,google(false));
    assertEquals(0,oauthCalls);assertEquals("customer",request.getSession().getAttribute("accountId"));assertEquals("driver",request.getSession().getAttribute("driverAccountId"));assertEquals(handler.failureUrl(),response.getRedirectedUrl());
  }
  @Test void existingPasswordAccountGetsLinkInstructionsWithoutStartingAnAccountSession() throws Exception {
    var request=new MockHttpServletRequest();var response=new MockHttpServletResponse();
    request.getSession().setAttribute("oauthMode","login");request.getSession().setAttribute("driverAccountId","driver");
    oauthFailure=new ApiException(409,"ACCOUNT_LINK_REQUIRED","Private provider details must not reach the URL");
    handler.onAuthenticationSuccess(request,response,google(true));
    assertEquals("http://localhost:5173/?auth=login&oauthError=account_link_required",response.getRedirectedUrl());
    assertNull(request.getSession().getAttribute("accountId"));assertNull(request.getSession().getAttribute("SPRING_SECURITY_CONTEXT"));assertEquals("driver",request.getSession().getAttribute("driverAccountId"));
  }
  @Test void profileConnectGooglePassesTheAuthenticatedAccountAndPreservesDriverSession() throws Exception {
    var request=new MockHttpServletRequest();var response=new MockHttpServletResponse();
    request.getSession().setAttribute("accountId",account.id);request.getSession().setAttribute("oauthMode","link");request.getSession().setAttribute("oauthLinkAccountId",account.id);request.getSession().setAttribute("oauthReturnTo","http://localhost:5173/landing.html");request.getSession().setAttribute("driverAccountId","driver");
    handler.onAuthenticationSuccess(request,response,google(true));
    assertSame(account,linkedAccount);assertEquals(account.id,request.getSession().getAttribute("accountId"));assertEquals("driver",request.getSession().getAttribute("driverAccountId"));assertEquals("http://localhost:5173/landing.html",response.getRedirectedUrl());assertNull(request.getSession().getAttribute("oauthLinkAccountId"));
  }
  @Test void mismatchedLinkHasAnActionableErrorAndKeepsTheOriginalAccountSignedIn() throws Exception {
    var request=new MockHttpServletRequest();var response=new MockHttpServletResponse();
    request.getSession().setAttribute("accountId",account.id);request.getSession().setAttribute("oauthMode","link");request.getSession().setAttribute("oauthLinkAccountId",account.id);
    oauthFailure=new ApiException(409,"ACCOUNT_LINK_MISMATCH","Private provider details");handler.onAuthenticationSuccess(request,response,google(true));
    assertEquals("http://localhost:5173/?auth=login&oauthError=account_link_mismatch",response.getRedirectedUrl());assertEquals(account.id,request.getSession().getAttribute("accountId"));assertNull(request.getSession().getAttribute("oauthMode"));
  }
}
