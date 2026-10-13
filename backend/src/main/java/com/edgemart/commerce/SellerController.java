package com.edgemart.commerce;

import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
public class SellerController {
  private final AccountService accounts;
  private final MarketplaceService market;

  public SellerController(AccountService accounts, MarketplaceService market) {
    this.accounts = accounts;
    this.market = market;
  }

  @GetMapping("/api/catalogue")
  public Map<String, Object> catalogue() {
    return market.catalogue();
  }

  @GetMapping("/api/seller/workspace")
  public Map<String, Object> workspace(HttpServletRequest req) {
    return market.workspace(accounts.current(req));
  }

  @PostMapping("/api/seller/profile")
  public Map<String, Object> profile(@RequestBody Map<String, Object> v, HttpServletRequest req) {
    return Map.of("seller", market.profile(accounts.current(req), v));
  }

  @PostMapping("/api/seller/products")
  public Map<String, Object> save(@RequestBody Map<String, Object> v, HttpServletRequest req) {
    return Map.of(
        "product",
        market.sellerProduct(
            market.save(
                accounts.current(req),
                Inputs.map(v.get("values")),
                Inputs.required(v, "department", 3, 30),
                Inputs.text(v, "id", 160))));
  }

  @DeleteMapping("/api/seller/products/{id}")
  public Map<String, Object> delete(@PathVariable String id, HttpServletRequest req) {
    market.delete(accounts.current(req), id);
    return Map.of("ok", true);
  }
}
