package com.edgemart.commerce;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.*;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("orders")
public class CommerceOrder {
  @Id public String id;

  @JsonIgnore
  @Indexed(unique = true)
  public String requestKey;

  @JsonIgnore public String buyerId;
  public int version = 1;
  public String sellerId,
      department,
      date,
      status,
      paymentStatus,
      currency = "INR",
      coupon,
      driverId;
  public long subtotal;
  public List<Map<String, Object>> items = new ArrayList<>(), events = new ArrayList<>();
  public Map<String, Object> address, preferences, payment, amount, store;
  public Map<String, Double> location;
  @JsonIgnore public Map<String, Object> driverLocation;
}
