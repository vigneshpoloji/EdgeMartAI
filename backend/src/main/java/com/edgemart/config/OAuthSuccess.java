package com.edgemart.config;

import com.edgemart.commerce.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class OAuthSuccess implements AuthenticationSuccessHandler {
  private final AccountService accounts;
  private final String frontend;
  private final HttpSessionSecurityContextRepository contexts;
  private final OAuth2AuthorizedClientService tokens;

  public OAuthSuccess(
      AccountService accounts,
      @Value("${edgemart.frontend-url}") String frontend,
      HttpSessionSecurityContextRepository contexts,
      OAuth2AuthorizedClientService tokens) {
    this.accounts = accounts;
    this.frontend = frontend.replaceAll("/+$", "");
    this.contexts = contexts;
    this.tokens = tokens;
  }

  public String failureUrl() {
    return frontend + "/?auth=login&oauthError=failed";
  }

  private String failureUrl(Exception error) {
    String code=error instanceof ApiException api?switch(api.code){
      case "ACCOUNT_LINK_REQUIRED" -> "account_link_required";
      case "ACCOUNT_LINK_MISMATCH" -> "account_link_mismatch";
      case "OAUTH_IDENTITY_CONFLICT" -> "identity_conflict";
      case "SESSION_EXPIRED" -> "link_session_expired";
      default -> "failed";
    }:"failed";
    return frontend+"/?auth=login&oauthError="+code;
  }

  public String returnTo(String value) {
    try {
      java.net.URI u = java.net.URI.create(value), base = java.net.URI.create(frontend);
      if (!Objects.equals(u.getScheme(), base.getScheme())
          || !Objects.equals(u.getAuthority(), base.getAuthority())
          || u.getUserInfo() != null
          || !(u.getPath().equals("/") || u.getPath().equals("/index.html")))
        throw new IllegalArgumentException();
      Map<String, String> q = new HashMap<>();
      if (u.getRawQuery() != null)
        for (String p : u.getRawQuery().split("&")) {
          String[] a = p.split("=", 2);
          q.put(
              java.net.URLDecoder.decode(a[0], java.nio.charset.StandardCharsets.UTF_8),
              a.length == 2
                  ? java.net.URLDecoder.decode(a[1], java.nio.charset.StandardCharsets.UTF_8)
                  : "");
        }
      String d = q.get("department");
      if (!Inputs.DEPARTMENTS.contains(d)) return frontend + "/landing.html";
      return frontend
          + "/?"
          + (Set.of("signup", "login", "dashboard").contains(q.getOrDefault("seller", ""))
              ? "seller=signup&"
              : "")
          + "department="
          + d;
    } catch (Exception e) {
      return frontend + "/landing.html";
    }
  }

  public void onAuthenticationSuccess(
      HttpServletRequest req, HttpServletResponse res, Authentication authentication)
      throws IOException {
    String destination =
        req.getSession(false) == null
            ? frontend + "/landing.html"
            : (String) req.getSession().getAttribute("oauthReturnTo");
    if (destination == null) destination = frontend + "/landing.html";
    try {
      OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
      String provider = token.getAuthorizedClientRegistrationId();
      Map<String, Object> attr = token.getPrincipal().getAttributes();
      String email;
      if (provider.equals("github")) {
        var client = tokens.loadAuthorizedClient(provider, token.getName());
        List<?> rows =
            RestClient.create()
                .get()
                .uri("https://api.github.com/user/emails")
                .header("Authorization", "Bearer " + client.getAccessToken().getTokenValue())
                .header("Accept", "application/vnd.github+json")
                .retrieve()
                .body(List.class);
        Map<?, ?> row =
            rows == null
                ? null
                : rows.stream()
                    .filter(
                        r ->
                            r instanceof Map<?, ?> m
                                && Boolean.TRUE.equals(m.get("verified"))
                                && Boolean.TRUE.equals(m.get("primary")))
                    .map(r -> (Map<?, ?>) r)
                    .findFirst()
                    .orElse(null);
        if (row == null) throw ApiException.bad("A verified GitHub email is required.");
        email = String.valueOf(row.get("email"));
      } else if(provider.equals("google")) {
        if(!Boolean.TRUE.equals(attr.get("email_verified")))throw ApiException.bad("A verified Google email is required.");
        email = String.valueOf(attr.getOrDefault("email", ""));
      } else throw ApiException.bad("Unsupported sign-in provider.");
      email = accounts.email(Map.of("email", email));
      String subject = String.valueOf(attr.get(provider.equals("google") ? "sub" : "id"));
      if (subject.equals("null")) throw ApiException.bad("Provider subject missing.");
      String name =
          String.valueOf(
              attr.getOrDefault("name", attr.getOrDefault("displayName",attr.getOrDefault("login", "EdgeMart customer"))));
      String mode=String.valueOf(req.getSession().getAttribute("oauthMode"));
      Account linking=null;
      if("link".equals(mode)){
        linking=accounts.current(req);
        if(!linking.id.equals(req.getSession().getAttribute("oauthLinkAccountId")))throw ApiException.bad("Sign in again before connecting this provider.");
      }
      Account a =
          accounts.oauth(
              provider + ":" + subject,
              email,
              name.length() > 100 ? name.substring(0, 100) : name,linking);
      req.getSession().removeAttribute("oauthMode");req.getSession().removeAttribute("oauthLinkAccountId");
      if("signup".equals(mode)){
        req.getSession().removeAttribute("accountId");req.getSession().removeAttribute("accountVersion");req.getSession().removeAttribute("SPRING_SECURITY_CONTEXT");
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
        req.getSession().removeAttribute("oauthReturnTo");
        java.net.URI target=java.net.URI.create(destination);
        if(target.getRawQuery()!=null&&target.getRawQuery().contains("seller="))res.sendRedirect(destination.replace("seller=signup","seller=login")+"&registered=1");
        else res.sendRedirect(frontend+"/?auth=login&registered=1&returnTo="+java.net.URLEncoder.encode(destination,java.nio.charset.StandardCharsets.UTF_8));
        return;
      }
      SecurityConfig.signin(a, req, res, contexts);
      req.getSession().removeAttribute("oauthReturnTo");
      res.sendRedirect(destination);
    } catch (Exception e) {
      if(req.getSession(false)!=null){req.getSession().removeAttribute("oauthReturnTo");req.getSession().removeAttribute("oauthMode");req.getSession().removeAttribute("oauthLinkAccountId");}
      try {SecurityConfig.signin(accounts.current(req),req,res,contexts);}
      catch(ApiException ignored){org.springframework.security.core.context.SecurityContextHolder.clearContext();if(req.getSession(false)!=null)req.getSession().removeAttribute("SPRING_SECURITY_CONTEXT");}
      res.sendRedirect(failureUrl(e));
    }
  }
}
