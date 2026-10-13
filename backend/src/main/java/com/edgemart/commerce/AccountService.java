package com.edgemart.commerce;

import static org.springframework.data.mongodb.core.query.Criteria.where;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AccountService {
  private final MongoTemplate mongo;
  private final RateLimiter limiter;
  private final BCryptPasswordEncoder passwords = new BCryptPasswordEncoder(12);
  private final String dummy = passwords.encode("UnusedPassword1!");

  public AccountService(MongoTemplate mongo, RateLimiter limiter) {
    this.mongo = mongo;
    this.limiter = limiter;
  }

  public Account byEmail(String email) {
    return mongo.findOne(Query.query(where("email").is(email)), Account.class);
  }

  public String email(Map<String, ?> values) {
    String email = Inputs.required(values, "email", 3, 254).toLowerCase(Locale.ROOT);
    if (!email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))
      throw ApiException.bad("Enter a valid email.");
    return email;
  }

  public String password(Map<String, ?> values) {
    return validatedPassword(values.get("password"));
  }

  public static String validatedPassword(Object v) {
    if (!(v instanceof String p)
        || p.getBytes(StandardCharsets.UTF_8).length > 72
        || p.length() < 8
        || !p.matches("(?s).*[A-Z].*")
        || !p.matches("(?s).*[a-z].*")
        || !p.matches("(?s).*[0-9].*")
        || !p.matches("(?s).*[^A-Za-z0-9\\s].*"))
      throw new ApiException(
          400,
          "WEAK_PASSWORD",
          "Use 8 or more characters, mixed case, a number and a symbol (maximum 72 bytes).");
    return p;
  }

  public Account signup(Map<String, Object> values, String ip) {
    String email = email(values);
    limiter.check("signup:" + ip, 10, 3600000);
    String password = password(values);
    if (byEmail(email) != null)
      throw new ApiException(
          409, "ACCOUNT_EXISTS", "An account uses this email. Sign in with your existing password.");
    Account a = new Account();
    a.id = UUID.randomUUID().toString();
    a.email = email;
    a.name = Inputs.required(values, "name", 2, 100);
    a.passwordHash = passwords.encode(password);
    mongo.insert(a);
    return a;
  }

  public Account login(Map<String, Object> values, String ip) {
    String email = email(values);
    limiter.check("login:" + ip, 30, 900000);
    limiter.check("login-email:" + email, 10, 900000);
    Account a = byEmail(email);
    String p = values.get("password") instanceof String s ? s : "";
    boolean valid =
        p.getBytes(StandardCharsets.UTF_8).length <= 72
            && passwords.matches(p, a != null && a.passwordHash != null ? a.passwordHash : dummy);
    if (a == null || a.passwordHash == null || !valid)
      throw new ApiException(401, "INVALID_CREDENTIALS", "The email or password is incorrect.");
    return a;
  }

  public Account current(HttpServletRequest req) {
    Object id =
        req.getSession(false) == null ? null : req.getSession(false).getAttribute("accountId");
    Account a = id instanceof String s ? mongo.findById(s, Account.class) : null;
    Object version =
        req.getSession(false) == null ? null : req.getSession(false).getAttribute("accountVersion");
    if (a == null || !Objects.equals(version, a.sessionVersion)) {
      if (req.getSession(false) != null) {
        var session=req.getSession(false);
        if(session.getAttribute("driverAccountId")!=null){session.removeAttribute("accountId");session.removeAttribute("accountVersion");session.removeAttribute("SPRING_SECURITY_CONTEXT");}
        else session.invalidate();
      }
      SecurityContextHolder.clearContext();
      throw new ApiException(401, "SESSION_EXPIRED", "Sign in to continue.");
    }
    return a;
  }

  public Account oauth(String identity, String email, String name) {
    return oauth(identity,email,name,null);
  }
  public Account oauth(String identity,String email,String name,Account linking){
    Account a = mongo.findOne(Query.query(new Criteria().orOperator(where("oauthIdentity").is(identity),where("oauthIdentities").is(identity))), Account.class);
    if (a != null) {
      if(linking!=null&&!linking.id.equals(a.id))throw new ApiException(409,"OAUTH_IDENTITY_CONFLICT","That provider is connected to another account.");
      return a;
    }
    Account existing=byEmail(email);
    if(linking!=null){
      if(existing==null||!existing.id.equals(linking.id))throw new ApiException(409,"ACCOUNT_LINK_MISMATCH","Choose the provider account with the same email as your signed-in account.");
      if(existing.oauthIdentities==null)existing.oauthIdentities=new ArrayList<>();
      existing.oauthIdentities.add(identity);return mongo.save(existing);
    }
    if (existing != null)
      throw new ApiException(
          409, "ACCOUNT_LINK_REQUIRED", "Sign in using your original account method, then use Profile to connect this provider.");
    a = new Account();
    a.id = UUID.randomUUID().toString();
    a.email = email;
    a.name = name;
    a.oauthIdentity = identity;
    return mongo.insert(a);
  }

  public Account currentDriver(HttpServletRequest req) {
    var session = req.getSession(false);
    if (session != null && session.getAttribute("driverAccountId") instanceof String id) {
      Account account = mongo.findById(id, Account.class);
      if (account != null && "driver".equals(account.role)
          && Objects.equals(session.getAttribute("driverAccountVersion"), account.sessionVersion)) return account;
      session.removeAttribute("driverAccountId");
      session.removeAttribute("driverAccountVersion");
      throw new ApiException(401, "SESSION_EXPIRED", "Sign in to your delivery account again.");
    }
    Account account = current(req);
    if (!"driver".equals(account.role)) throw new ApiException(403, "DRIVER_REQUIRED", "Sign in with your delivery account.");
    return account;
  }

}
