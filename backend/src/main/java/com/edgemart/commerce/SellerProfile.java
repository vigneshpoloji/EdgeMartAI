package com.edgemart.commerce;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.Map;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("seller_profiles")
public class SellerProfile {
  @Id public String id;
  @JsonIgnore public String accountId;
  public String email, name, store, city, phone, description, defaultDepartment;
  public Map<String, Double> location;
}
