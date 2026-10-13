package com.edgemart.model;

import java.math.BigDecimal;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "products")
public class Product {
  public String department,
      variant = "1 selling unit",
      sku = "",
      attribute = "",
      subCategory = "other",
      status = "active",
      createdAt,
      updatedAt;
  public boolean rxRequired;
  public java.util.Map<String, String> details = new java.util.LinkedHashMap<>();
  @org.springframework.data.annotation.Version public Long version;

  @Id private String id;
  private String name;
  private String category;
  private String description;
  private BigDecimal price;
  private Integer stock;
  private String imageUrl;
  private String sellerId;

  public Product() {}

  public Product(
      String id,
      String name,
      String category,
      String description,
      BigDecimal price,
      Integer stock,
      String imageUrl,
      String sellerId) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.description = description;
    this.price = price;
    this.stock = stock;
    this.imageUrl = imageUrl;
    this.sellerId = sellerId;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public BigDecimal getPrice() {
    return price;
  }

  public void setPrice(BigDecimal price) {
    this.price = price;
  }

  public Integer getStock() {
    return stock;
  }

  public void setStock(Integer stock) {
    this.stock = stock;
  }

  public String getImageUrl() {
    return imageUrl;
  }

  public void setImageUrl(String imageUrl) {
    this.imageUrl = imageUrl;
  }

  public String getSellerId() {
    return sellerId;
  }

  public void setSellerId(String sellerId) {
    this.sellerId = sellerId;
  }
}
