package com.edgemart.commerce;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("accounts")
public class Account {
  @Id public String id;

  @Indexed(unique = true)
  public String email;

  public String name;
  public String role = "buyer";
  @JsonIgnore public String passwordHash;
  @JsonIgnore public String oauthIdentity;
  @JsonIgnore public java.util.List<String> oauthIdentities = new java.util.ArrayList<>();
  @JsonIgnore public long sessionVersion;
  @JsonIgnore public String driverStoreId, driverPhone, driverCity, driverVehicle;
  @JsonIgnore public boolean driverAvailable = true;
}
