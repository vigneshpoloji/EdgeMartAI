package com.edgemart.commerce;

import static org.springframework.data.mongodb.core.query.Criteria.where;

import com.edgemart.model.Product;
import java.math.*;
import java.time.Instant;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Service;

@Service
public class MarketplaceService {
  @Value("${edgemart.import-owner-id:}") private String importOwnerId;
  @Value("${edgemart.import-product-ids:}") private String importProductIds;
  private final MongoTemplate mongo;
  public final double radius;

  public MarketplaceService(
      MongoTemplate mongo, @Value("${edgemart.delivery-radius-km}") double radius) {
    this.mongo = mongo;
    this.radius = radius;
  }

  public SellerProfile seller(Account a) {
    SellerProfile p = mongo.findById("seller-" + a.id, SellerProfile.class);
    if (p == null)
      throw new ApiException(
          403, "SELLER_REQUIRED", "Create a seller profile to open your workspace.");
    return p;
  }

  public SellerProfile profile(Account a, Map<String, Object> v) {
    SellerProfile p = mongo.findById("seller-" + a.id, SellerProfile.class);
    boolean fresh = p == null;
    if (fresh) {
      p = new SellerProfile();
      p.id = "seller-" + a.id;
      p.accountId = a.id;
      p.email = a.email;
    }
    p.name = Inputs.required(v, "name", 2, 100);
    p.store = Inputs.required(v, "store", 2, 100);
    p.city = Inputs.required(v, "city", 2, 100);
    p.phone = Inputs.text(v, "phone", 10);
    if (!p.phone.isEmpty() && !p.phone.matches("[6-9][0-9]{9}"))
      throw ApiException.bad("Enter a valid Indian mobile number.");
    p.description = Inputs.text(v, "description", 500);
    if (fresh) p.defaultDepartment = Inputs.department(Inputs.required(v, "department", 3, 30));
    if (v.containsKey("location")) p.location = Inputs.location(v.get("location"), false);
    SellerProfile saved=mongo.save(p);
    importExisting(a,saved);
    return saved;
  }

  public Product requireProduct(String id) {
    Product p = mongo.findById(id, Product.class);
    if (p == null || "deleted".equals(p.status)) throw ApiException.missing();
    return p;
  }

  public static String department(Product p) {
    return p.department != null ? p.department : p.getCategory().toLowerCase(Locale.ROOT);
  }

  public static boolean active(Product p) {
    return p.status == null || p.status.equals("active");
  }

  public List<Product> products(String category, String sellerId) {
    Criteria c = new Criteria();
    List<Criteria> criteria = new ArrayList<>();
    criteria.add(
        new Criteria()
            .orOperator(
                where("status").is("active"),
                where("status").exists(false),
                where("status").is(null)));
    if (category != null && !category.isBlank())
      criteria.add(
          where("category").regex("^" + java.util.regex.Pattern.quote(category) + "$", "i"));
    if (sellerId != null && !sellerId.isBlank()) criteria.add(where("sellerId").is(sellerId));
    return mongo.find(Query.query(c.andOperator(criteria)), Product.class);
  }

  public Map<String, Object> sellerProduct(Product p) {
    Map<String, Object> r = new LinkedHashMap<>();
    r.put("id", p.getId());
    r.put("sellerId", p.getSellerId());
    r.put("name", p.getName());
    r.put("department", department(p));
    r.put("category", p.getCategory());
    r.put("description", p.getDescription());
    r.put("unitPaise", paise(p.getPrice()));
    r.put("price", p.getPrice());
    r.put("stock", p.getStock() == null ? 0 : p.getStock());
    r.put("image", p.getImageUrl() == null ? "" : p.getImageUrl());
    r.put("imageUrl", p.getImageUrl());
    r.put("variant", p.variant == null ? "1 selling unit" : p.variant);
    r.put("sku", p.sku == null ? "" : p.sku);
    r.put("attribute", p.attribute == null ? "" : p.attribute);
    r.put("subCategory", p.subCategory == null ? "other" : p.subCategory);
    r.put("status", p.status == null ? "active" : p.status);
    r.put("details", p.details == null ? Map.of() : p.details);
    r.put("rxRequired", p.rxRequired);
    r.put("createdAt", p.createdAt == null ? Instant.EPOCH.toString() : p.createdAt);
    r.put("updatedAt", p.updatedAt == null ? Instant.EPOCH.toString() : p.updatedAt);
    return r;
  }

  public Map<String, Object> catalogue() {
    List<Map<String, Object>> profiles =
        mongo.findAll(SellerProfile.class).stream()
            .map(
                p -> {
                  Map<String, Object> r = new LinkedHashMap<>();
                  r.put("id", p.id);
                  r.put("store", p.store);
                  r.put("city", p.city);
                  r.put("location", p.location);
                  return r;
                })
            .toList();
    return Map.of(
        "products",
        products(null, null).stream().map(this::sellerProduct).toList(),
        "profiles",
        profiles,
        "radiusKm",
        radius);
  }

  public Map<String, Object> workspace(Account a) {
    SellerProfile s = seller(a);
    List<Product> p =
        mongo.find(
            Query.query(where("sellerId").is(s.id).and("status").ne("deleted")), Product.class);
    List<CommerceOrder> o =
        mongo.find(
            Query.query(where("sellerId").is(s.id))
                .with(
                    org.springframework.data.domain.Sort.by(
                        org.springframework.data.domain.Sort.Direction.DESC, "date")),
            CommerceOrder.class);
    return Map.of(
        "seller", s, "products", p.stream().map(this::sellerProduct).toList(), "orders", o);
  }

  public Product save(Account a, Map<String, Object> v, String department, String id) {
    SellerProfile s = seller(a);
    String d = Inputs.department(department);
    Product p = id == null || id.isBlank() ? new Product() : owned(a, id);
    boolean fresh = p.getId() == null;
    if (fresh) {
      p.setId("seller-product-" + UUID.randomUUID());
      p.setSellerId(s.id);
      p.createdAt = Instant.now().toString();
    }
    p.setName(Inputs.required(v, "name", 3, 120));
    p.setDescription(Inputs.required(v, "description", 10, 1000));
    p.variant = Inputs.required(v, "variant", 1, 120);
    p.sku = Inputs.text(v, "sku", 60);
    p.attribute = Inputs.text(v, "attribute", 300);
    p.department = d;
    p.setCategory(Character.toUpperCase(d.charAt(0)) + d.substring(1));
    try {
      BigDecimal price = new BigDecimal(String.valueOf(v.get("price")));
      if (price.signum() <= 0
          || price.compareTo(new BigDecimal("10000000")) > 0
          || price.stripTrailingZeros().scale() > 2) throw new IllegalArgumentException();
      p.setPrice(price.setScale(2));
    } catch (Exception e) {
      throw ApiException.bad("Enter a valid price with up to two decimals.");
    }
    p.setStock(Inputs.integer(v.get("stock"), 0, 999999, "stock"));
    p.status = Inputs.required(v, "status", 3, 10);
    if (!Set.of("active", "draft", "paused").contains(p.status))
      throw ApiException.bad("Choose a listing status.");
    p.subCategory = Inputs.text(v, "subCategory", 40);
    p.rxRequired = d.equals("pharmacy") && Boolean.TRUE.equals(v.get("rxRequired"));
    p.details = new LinkedHashMap<>();
    if (v.get("details") != null) {
      Map<String, Object> details = Inputs.map(v.get("details"));
      if (details.size() > 30) throw ApiException.bad("Too many detail fields.");
      for (String key : details.keySet()) {
        if (!key.matches("[A-Za-z][A-Za-z0-9]{0,39}"))
          throw ApiException.bad("Invalid product detail.");
        p.details.put(key, Inputs.text(details, key, 300));
      }
    }
    p.setImageUrl(photo(Inputs.text(v, v.containsKey("image") ? "image" : "imageUrl", 850000)));
    if (!p.sku.isEmpty()
        && mongo.exists(
            Query.query(
                where("sellerId")
                    .is(s.id)
                    .and("department")
                    .is(d)
                    .and("sku")
                    .is(p.sku)
                    .and("status")
                    .ne("deleted")
                    .and("_id")
                    .ne(p.getId())),
            Product.class))
      throw new ApiException(409, "SKU_EXISTS", "This SKU is already used in your store.");
    p.updatedAt = Instant.now().toString();
    return mongo.save(p);
  }

  public Product owned(Account a, String id) {
    SellerProfile s = seller(a);
    Product p = requireProduct(id);
    if (!s.id.equals(p.getSellerId()))
      throw new ApiException(403, "FORBIDDEN", "You can only change your own products.");
    if (p.version == null) {
      mongo.updateFirst(Query.query(where("_id").is(id).and("version").is(null)),new Update().set("version",0L),Product.class);
      p=requireProduct(id);
    }
    return p;
  }

  public void delete(Account a, String id) {
    Product p = owned(a, id);
    p.status = "deleted";
    p.updatedAt = Instant.now().toString();
    mongo.save(p);
  }

  public void importExisting(Account account,SellerProfile seller){
    if(importOwnerId.isBlank()||!account.id.equals(importOwnerId))return;
    List<String> ids=Arrays.stream(importProductIds.split(",")).map(String::trim).filter(id->!id.isEmpty()).toList();
    if(ids.isEmpty())return;
    for(Product product:mongo.find(Query.query(where("_id").in(ids)),Product.class)){
      if(product.getSellerId()!=null && mongo.findById(product.getSellerId(),SellerProfile.class)!=null)continue;
      Update change=new Update().set("sellerId",seller.id).set("department",department(product)).set("updatedAt",Instant.now().toString());
      if(product.version==null)change.set("version",0L);
      mongo.updateFirst(Query.query(where("_id").is(product.getId()).and("sellerId").is(product.getSellerId())),change,Product.class);
    }
  }

  public static long paise(BigDecimal price) {
    try {
      return price.multiply(new BigDecimal(100)).longValueExact();
    } catch (Exception e) {
      throw ApiException.bad("Invalid product price.");
    }
  }

  private String photo(String s) {
    if (s.isEmpty()) return s;
    if (s.matches("^/images/[A-Za-z0-9_./-]+$") && !s.contains("..")) return s;
    if (s.startsWith("data:")) {
      if (!s.matches("data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*") || s.length() > 850000)
        throw ApiException.bad("Upload a smaller JPG, PNG or WebP image.");
      try {
        byte[] b = Base64.getDecoder().decode(s.substring(s.indexOf(',') + 1));
        boolean jpeg =
            b.length > 3 && (b[0] & 255) == 255 && (b[1] & 255) == 216 && (b[2] & 255) == 255;
        boolean png = b.length > 8 && (b[0] & 255) == 137 && b[1] == 80 && b[2] == 78 && b[3] == 71;
        boolean webp =
            b.length > 12
                && new String(b, 0, 4, java.nio.charset.StandardCharsets.US_ASCII).equals("RIFF")
                && new String(b, 8, 4, java.nio.charset.StandardCharsets.US_ASCII).equals("WEBP");
        if (!(jpeg || png || webp)) throw new IllegalArgumentException();
        return s;
      } catch (Exception e) {
        throw ApiException.bad("Invalid product photo.");
      }
    }
    try {
      java.net.URI u = java.net.URI.create(s);
      if (s.length() <= 2000
          && "https".equals(u.getScheme())
          && u.getHost() != null
          && u.getUserInfo() == null) return s;
    } catch (Exception e) {
    }
    throw ApiException.bad("Use an HTTPS image link or upload a photograph.");
  }
}
