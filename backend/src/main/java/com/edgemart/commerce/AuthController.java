package com.edgemart.commerce;

import com.edgemart.config.*;
import jakarta.servlet.http.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {
  private final AccountService accounts;
  private final RegistrationService registration;
  private final OAuthRegistrations providers;
  private final OAuthSuccess oauth;
  private final HttpSessionSecurityContextRepository contexts;
  private final String backendUrl;

  @Value("${server.servlet.session.cookie.secure}")
  private boolean secureCookie;

  @Value("${server.servlet.session.cookie.same-site}")
  private String sameSite;

  public AuthController(
      AccountService accounts,
      RegistrationService registration,
      OAuthRegistrations providers,
      OAuthSuccess oauth,
      HttpSessionSecurityContextRepository contexts,
      @Value("${edgemart.backend-url}") String url) {
    this.accounts = accounts;
    this.registration = registration;
    this.providers = providers;
    this.oauth = oauth;
    this.contexts = contexts;
    backendUrl = url.replaceAll("/+$", "");
  }

  @GetMapping("/api/health")
  Map<String, Object> health() {
    return Map.of("status", "ok", "service", "EdgeMart API");
  }

  @GetMapping("/config")
  Map<String, Object> config() {
    return Map.of(
        "providers", providers.providers(), "payments", List.of("cod"));
  }

  @GetMapping("/session")
  Map<String, Object> session(HttpServletRequest req, CsrfToken csrf) {
    Account a = null;
    if (req.getSession(false) != null && req.getSession().getAttribute("accountId") != null)
      try {
        a = accounts.current(req);
      } catch (ApiException ignored) {
      }
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("user", a);
    result.put("csrfToken", csrf.getToken());
    return result;
  }

  @PostMapping("/signup")
  Map<String, Object> signup(@RequestBody Map<String, Object> v, HttpServletRequest req, HttpServletResponse res) {
    return Map.of("user",registration.signup(v,req.getRemoteAddr()),"registered",true);
  }

  @PostMapping("/login")
  Map<String, Object> login(
      @RequestBody Map<String, Object> v, HttpServletRequest req, HttpServletResponse res) {
    Account a = accounts.login(v, req.getRemoteAddr());
    return signin(a, v, req, res);
  }

  private Map<String, Object> signin(Account a, Map<String, Object> v, HttpServletRequest req, HttpServletResponse res) {
    SecurityConfig.signin(a, req, res, contexts);
    boolean remember = Boolean.TRUE.equals(v.get("remember"));
    req.getSession().setMaxInactiveInterval(remember ? 30 * 86400 : 8 * 3600);
    res.addHeader(
        "Set-Cookie",
        org.springframework.http.ResponseCookie.from("JSESSIONID", req.getSession().getId())
            .httpOnly(true)
            .secure(secureCookie)
            .sameSite(sameSite)
            .path("/")
            .maxAge(remember ? 30 * 86400 : -1)
            .build()
            .toString());
    return Map.of("user", a);
  }

  @PostMapping("/logout")
  Map<String, Object> logout(HttpServletRequest req, HttpServletResponse res) {
    if (req.getSession(false) != null && req.getSession(false).getAttribute("driverAccountId") != null) {
      req.getSession().removeAttribute("accountId");req.getSession().removeAttribute("accountVersion");req.getSession().removeAttribute("SPRING_SECURITY_CONTEXT");
      SecurityContextHolder.clearContext();return Map.of("ok",true);
    }
    if (req.getSession(false) != null) req.getSession(false).invalidate();
    SecurityContextHolder.clearContext();
    res.addHeader(
        "Set-Cookie",
        org.springframework.http.ResponseCookie.from("JSESSIONID", "")
            .httpOnly(true)
            .secure(secureCookie)
            .sameSite(sameSite)
            .path("/")
            .maxAge(0)
            .build()
            .toString());
    return Map.of("ok", true);
  }

  @PostMapping("/oauth/start")
  Map<String, Object> start(@RequestBody Map<String, Object> v, HttpServletRequest req) {
    String p = Inputs.required(v, "provider", 3, 20);
    if (!providers.providers().contains(p))
      throw new ApiException(
          503, "OAUTH_NOT_CONFIGURED", "Configure this provider in the backend first.");
    req.getSession()
        .setAttribute("oauthReturnTo", oauth.returnTo(Inputs.text(v, "returnTo", 2000)));
    String mode=Inputs.text(v,"mode",10);if(mode.isEmpty())mode="login";
    if(!Set.of("login","signup","link").contains(mode))throw ApiException.bad("Invalid sign-in mode.");
    req.getSession().setAttribute("oauthMode",mode);
    if(mode.equals("link"))req.getSession().setAttribute("oauthLinkAccountId",accounts.current(req).id);
    else req.getSession().removeAttribute("oauthLinkAccountId");
    return Map.of("url", backendUrl + "/oauth2/authorization/" + p);
  }

}
