package com.edgemart.commerce;

import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
public class OrderController {
  private final AccountService accounts;
  private final OrderService orders;

  public OrderController(AccountService a, OrderService o) {
    accounts = a;
    orders = o;
  }

  @GetMapping("/api/orders")
  Map<String, Object> list(HttpServletRequest req) {
    return Map.of("orders", orders.list(accounts.current(req)));
  }

  @PostMapping("/api/orders")
  Map<String, Object> create(@RequestBody Map<String, Object> v, HttpServletRequest req) {
    return Map.of("order", orders.create(accounts.current(req), v));
  }

  @PostMapping("/api/orders/{id}/cancel")
  Map<String, Object> cancel(@PathVariable String id, HttpServletRequest req) {
    return Map.of("order", orders.cancel(accounts.current(req), id));
  }

  @GetMapping("/api/orders/{id}/tracking")
  Map<String, Object> tracking(@PathVariable String id, HttpServletRequest req) {
    return orders.tracking(accounts.current(req), id);
  }

  @PostMapping("/api/orders/{id}/delivery-location")
  Map<String, Object> deliveryLocation(
      @PathVariable String id, @RequestBody Map<String, Object> v, HttpServletRequest req) {
    return Map.of("order", orders.deliveryLocation(accounts.current(req), id, v.get("location")));
  }

  @PostMapping("/api/seller/orders/{id}/status")
  Map<String, Object> status(
      @PathVariable String id, @RequestBody Map<String, Object> v, HttpServletRequest req) {
    return Map.of(
        "order",
        orders.status(accounts.current(req), id, Inputs.required(v, "status", 5, 30)));
  }

  @GetMapping("/api/driver/orders")
  Map<String, Object> driver(HttpServletRequest req) {
    return Map.of("orders", orders.driverOrders(accounts.currentDriver(req)));
  }

  @PostMapping("/api/driver/orders/{id}/claim")
  Map<String, Object> claim(@PathVariable String id, HttpServletRequest req) {
    return Map.of("order", orders.claim(accounts.currentDriver(req), id));
  }

  @PostMapping("/api/driver/orders/{id}/location")
  Map<String, Object> location(
      @PathVariable String id, @RequestBody Map<String, Object> v, HttpServletRequest req) {
    orders.location(accounts.currentDriver(req), id, v);
    return Map.of("ok", true);
  }

  @PostMapping("/api/driver/orders/{id}/complete")
  Map<String, Object> complete(
      @PathVariable String id, @RequestBody Map<String, Object> v, HttpServletRequest req) {
    return Map.of("order", orders.complete(accounts.currentDriver(req), id, v));
  }
}
