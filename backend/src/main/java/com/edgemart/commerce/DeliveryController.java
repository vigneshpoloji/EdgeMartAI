package com.edgemart.commerce;
import jakarta.servlet.http.*;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.web.csrf.CsrfToken;
@RestController
public class DeliveryController {
  private final AccountService accounts;
  private final DeliveryService delivery;
  public DeliveryController(AccountService accounts,DeliveryService delivery){this.accounts=accounts;this.delivery=delivery;}
  @GetMapping("/auth/driver/session") Map<String,Object> session(HttpServletRequest req,CsrfToken csrf){
    Account account=null;try{account=accounts.currentDriver(req);}catch(ApiException ignored){}
    Map<String,Object> result=new LinkedHashMap<>();result.put("user",account);result.put("csrfToken",csrf.getToken());return result;
  }
  private Map<String,Object> signin(Account account,HttpServletRequest req){
    if(!"driver".equals(account.role))throw new ApiException(403,"DRIVER_REQUIRED","Use your delivery partner account to sign in here.");
    if(req.getSession(false)!=null)req.changeSessionId();
    var session=req.getSession();session.setAttribute("driverAccountId",account.id);session.setAttribute("driverAccountVersion",account.sessionVersion);return Map.of("user",account);
  }
  @PostMapping("/auth/driver/login") Map<String,Object> login(@RequestBody Map<String,Object> values,HttpServletRequest req){return signin(accounts.login(values,req.getRemoteAddr()),req);}
  @PostMapping("/auth/driver/signup") Map<String,Object> signup(@RequestBody Map<String,Object> values,HttpServletRequest req){return Map.of("user",delivery.signup(values,req.getRemoteAddr()),"registered",true);}
  @PostMapping("/auth/driver/logout") Map<String,Object> logout(HttpServletRequest req){
    var session=req.getSession(false);
    if(session!=null){session.removeAttribute("driverAccountId");session.removeAttribute("driverAccountVersion");
      if(session.getAttribute("accountId")!=null){try{if("driver".equals(accounts.current(req).role)){session.removeAttribute("accountId");session.removeAttribute("accountVersion");session.removeAttribute("SPRING_SECURITY_CONTEXT");}}catch(ApiException ignored){}}
    }return Map.of("ok",true);
  }
  @GetMapping("/api/driver/profile") Map<String,Object> profile(HttpServletRequest req){return Map.of("profile",delivery.profile(accounts.currentDriver(req)));}
  @PostMapping("/api/driver/profile") Map<String,Object> update(@RequestBody Map<String,Object> values,HttpServletRequest req){return Map.of("profile",delivery.update(accounts.currentDriver(req),values));}
  @PostMapping("/api/driver/availability") Map<String,Object> availability(@RequestBody Map<String,Object> values,HttpServletRequest req){return Map.of("profile",delivery.availability(accounts.currentDriver(req),values));}
  @GetMapping("/api/seller/drivers") Map<String,Object> partners(HttpServletRequest req){return Map.of("drivers",delivery.partners(accounts.current(req)));}
}
