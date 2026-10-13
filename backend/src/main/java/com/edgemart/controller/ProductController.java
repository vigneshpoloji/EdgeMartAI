package com.edgemart.controller;

import com.edgemart.commerce.*;
import com.edgemart.model.Product;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
public class ProductController {
  private final MarketplaceService market;
  private final AccountService accounts;

  public ProductController(MarketplaceService market, AccountService accounts) {
    this.market = market;
    this.accounts = accounts;
  }

  @GetMapping
  public List<Product> all(
      @RequestParam(required = false) String category,
      @RequestParam(required = false) String sellerId) {
    return market.products(category, sellerId);
  }

  @GetMapping("/{id}")
  public Product one(@PathVariable String id, HttpServletRequest req) {
    Product p = market.requireProduct(id);
    if (!MarketplaceService.active(p)) market.owned(accounts.current(req), id);
    return p;
  }

  @PostMapping
  public ResponseEntity<Product> create(
      @RequestBody Map<String, Object> v, HttpServletRequest req) {
    Map<String, Object> fields = new LinkedHashMap<>(v);
    fields.putIfAbsent("variant", "1 selling unit");
    fields.putIfAbsent("status", "active");
    return ResponseEntity.status(201)
        .body(
            market.save(
                accounts.current(req), fields, Inputs.required(v, "category", 3, 30), null));
  }

  @PutMapping("/{id}")
  public Product update(
      @PathVariable String id, @RequestBody Map<String, Object> v, HttpServletRequest req) {
    Map<String, Object> fields = new LinkedHashMap<>(v);
    fields.putIfAbsent("variant", "1 selling unit");
    fields.putIfAbsent("status", "active");
    return market.save(
        accounts.current(req), fields, Inputs.required(v, "category", 3, 30), id);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable String id, HttpServletRequest req) {
    market.delete(accounts.current(req), id);
    return ResponseEntity.noContent().build();
  }
}
