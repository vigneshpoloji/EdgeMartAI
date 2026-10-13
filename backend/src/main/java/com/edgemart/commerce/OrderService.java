package com.edgemart.commerce;

import static org.springframework.data.mongodb.core.query.Criteria.where;

import com.edgemart.model.Product;
import java.time.*;
import java.util.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {
  private final MongoTemplate mongo;
  private final MarketplaceService market;
  private static final Map<String, Long> POTS =
      Map.of(
          "nursery", 0L, "pot_terracotta", 18000L, "pot_ceramic", 25000L, "pot_selfwater", 32000L);
  private static final Map<String, Long> ADDONS =
      Map.of("soil_perlite", 14000L, "fert_neem", 19900L, "nutri_sticks", 9900L);

  public OrderService(
      MongoTemplate mongo, MarketplaceService market) {
    this.mongo = mongo;
    this.market = market;
  }

  public List<CommerceOrder> list(Account a) {
    return mongo.find(
        Query.query(where("buyerId").is(a.id))
            .with(
                org.springframework.data.domain.Sort.by(
                    org.springframework.data.domain.Sort.Direction.DESC, "date")),
        CommerceOrder.class);
  }

  public CommerceOrder require(String id) {
    CommerceOrder o = mongo.findById(id, CommerceOrder.class);
    if (o == null) throw ApiException.missing();
    return o;
  }

  public CommerceOrder buyer(Account a, String id) {
    CommerceOrder o = require(id);
    if (!a.id.equals(o.buyerId)) throw ApiException.missing();
    return o;
  }

  @Transactional
  public CommerceOrder create(Account buyer, Map<String, Object> v) {
    String key = Inputs.required(v, "idempotencyKey", 8, 100);
    if (!key.matches("[A-Za-z0-9_-]+")) throw ApiException.bad("Invalid order request key.");
    String requestKey = buyer.id + ":" + key;
    CommerceOrder existing =
        mongo.findOne(Query.query(where("requestKey").is(requestKey)), CommerceOrder.class);
    if (existing != null) return existing;
    Map<String, Double> location = deliveryCoordinates(v.get("location"));
    Object raw = v.get("items");
    if (!(raw instanceof List<?> rows) || rows.isEmpty() || rows.size() > 100)
      throw ApiException.bad("Check your basket.");
    Map<String, Object> address = address(Inputs.map(v.get("address"))),
        prefs = preferences(Inputs.map(v.get("preferences"))),
        pay = Inputs.map(v.get("payment"));
    if (!"cod".equals(pay.get("method")))
      throw new ApiException(400, "PAYMENT_UNAVAILABLE", "Only cash on delivery is connected.");
    List<Map<String, Object>> lines = new ArrayList<>();
    Map<String, Integer> quantities = new LinkedHashMap<>();
    Map<String, Product> products = new LinkedHashMap<>();
    Set<String> sellers = new HashSet<>(), departments = new HashSet<>();
    long subtotal = 0;
    for (Object row : rows) {
      Map<String, Object> i = Inputs.map(row);
      String id = Inputs.required(i, "id", 1, 160);
      Product p = market.requireProduct(id);
      if (!MarketplaceService.active(p) || p.getSellerId() == null)
        throw new ApiException(
            409, "PRODUCT_UNAVAILABLE", "A product is not available for ordering.");
      String d = MarketplaceService.department(p);
      int qty = Inputs.integer(i.get("quantity"), 1, 99, "quantity");
      Map<String, Object> options =
          i.get("options") == null ? Map.of() : Inputs.map(i.get("options"));
      long unit = MarketplaceService.paise(p.getPrice()) + extras(d, options);
      if (Inputs.integer(i.get("unitPaise"), 1, 1100000000, "unit price") != unit)
        throw new ApiException(
            409, "PRICE_CHANGED", "A product price changed. Review your basket.");
      if (!d.equals(i.get("category"))) throw ApiException.bad("Check the product category.");
      if (p.rxRequired && !Boolean.TRUE.equals(prefs.get("rxAcknowledged")))
        throw ApiException.bad("Prescription items need pharmacist review acknowledgment.");
      Map<String, Object> line = new LinkedHashMap<>();
      line.put(
          "key",
          Inputs.text(i, "key", 250).isBlank()
              ? id + "-" + lines.size()
              : Inputs.text(i, "key", 250));
      line.put("id", id);
      line.put("name", p.getName());
      line.put("category", d);
      line.put("image", p.getImageUrl() == null ? "" : p.getImageUrl());
      line.put("quantity", qty);
      line.put("unitPaise", unit);
      line.put("variant", p.variant);
      line.put("options", options);
      line.put("rxRequired", p.rxRequired);
      lines.add(line);
      subtotal = Math.addExact(subtotal, Math.multiplyExact(unit, qty));
      quantities.merge(id, qty, Integer::sum);
      products.put(id, p);
      sellers.add(p.getSellerId());
      departments.add(d);
    }
    if (sellers.size() != 1 || departments.size() != 1)
      throw ApiException.bad("Place one store and one department in each order.");
    String sellerId = sellers.iterator().next(), d = departments.iterator().next();
    SellerProfile seller = mongo.findById(sellerId, SellerProfile.class);
    if (seller == null)
      throw new ApiException(
          409,
          "STORE_UNAVAILABLE",
          "This product needs a registered seller store before it can be ordered.");
    if (Set.of("food", "fruits").contains(d)
        && (seller.location == null || Inputs.distance(location, seller.location) > market.radius))
      throw new ApiException(
          400,
          "OUTSIDE_DELIVERY_AREA",
          "This store only delivers food and fruit within " + market.radius + " km.");
    String coupon = Inputs.text(v, "coupon", 30).toUpperCase(Locale.ROOT);
    if (!coupon.isEmpty() && !coupon.equals("EDGEMART10"))
      throw ApiException.bad("Invalid offer code.");
    long discount =
        coupon.equals("EDGEMART10") && subtotal >= 50000
            ? Math.min(Math.round(subtotal * .1), 20000)
            : 0;
    long shipping = prefs.get("delivery").equals("express") ? 9900 : subtotal >= 99900 ? 0 : 4900;
    long tip = d.equals("food") ? ((Number) prefs.get("tip")).longValue() * 100 : 0;
    // All stock reservations and the order commit in one Atlas transaction.
    for (var entry : quantities.entrySet()) {
      Product p = products.get(entry.getKey());
      Criteria active =
          new Criteria()
              .orOperator(
                  where("status").is("active"),
                  where("status").exists(false),
                  where("status").is(null));
      Query q =
          Query.query(
              new Criteria()
                  .andOperator(
                      where("_id").is(p.getId()),
                      where("stock").gte(entry.getValue()),
                      where("price").is(p.getPrice()),
                      active));
      if (mongo.findAndModify(q, new Update().inc("stock", -entry.getValue()), Product.class)
          == null)
        throw new ApiException(
            409,
            "OUT_OF_STOCK",
            "A product has insufficient stock or its listing changed. Review your basket.");
    }
    CommerceOrder o = new CommerceOrder();
    o.id = "EM-" + UUID.randomUUID().toString().toUpperCase(Locale.ROOT);
    o.requestKey = requestKey;
    o.buyerId = buyer.id;
    o.sellerId = sellerId;
    o.department = d;
    o.date = Instant.now().toString();
    o.status = "confirmed";
    o.paymentStatus = "cash_due";
    o.items = lines;
    o.subtotal = subtotal;
    o.address = address;
    o.preferences = prefs;
    o.payment = Map.of("method", "cod", "preference", "");
    o.coupon = coupon;
    o.amount =
        Map.of(
            "subtotal",
            subtotal,
            "shipping",
            shipping,
            "discount",
            discount,
            "tip",
            tip,
            "total",
            subtotal + shipping + tip - discount);
    o.location = location;
    o.store = new LinkedHashMap<>();
    o.store.put("name", seller.store);
    o.store.put("location", seller.location);
    event(o, "confirmed");
    return mongo.insert(o);
  }

  private long extras(String d, Map<String, Object> options) {
    if (!d.equals("plants")) {
      if (options.size() > 10) throw ApiException.bad("Too many product options.");
      return 0;
    }
    String pot = options.get("pot") instanceof String s ? s : "nursery";
    if (!POTS.containsKey(pot)) throw ApiException.bad("Invalid planter option.");
    Object raw = options.getOrDefault("addons", List.of());
    if (!(raw instanceof List<?> ids) || ids.size() > 3 || new HashSet<>(ids).size() != ids.size())
      throw ApiException.bad("Invalid plant extras.");
    long extras = POTS.get(pot);
    for (Object id : ids) {
      if (!ADDONS.containsKey(id)) throw ApiException.bad("Invalid plant extra.");
      extras += ADDONS.get(id);
    }
    return extras;
  }

  private Map<String, Object> address(Map<String, Object> a) {
    Map<String, Object> r = new LinkedHashMap<>();
    for (String key :
        List.of(
            "name",
            "email",
            "phone",
            "pin",
            "street",
            "area",
            "city",
            "state",
            "label",
            "instructions"))
      r.put(key, Inputs.text(a, key, key.equals("instructions") ? 300 : 254));
    if (((String) r.get("name")).length() < 2
        || !((String) r.get("email")).matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")
        || !((String) r.get("phone")).matches("[6-9][0-9]{9}")
        || !((String) r.get("pin")).matches("[1-9][0-9]{5}")
        || ((String) r.get("street")).length() < 5
        || ((String) r.get("city")).length() < 2
        || ((String) r.get("state")).length() < 2)
      throw ApiException.bad("Check the delivery address.");
    return r;
  }

  private Map<String, Object> preferences(Map<String, Object> p) {
    String delivery = Inputs.required(p, "delivery", 7, 10);
    if (!Set.of("standard", "express").contains(delivery))
      throw ApiException.bad("Choose a delivery preference.");
    String date = Inputs.text(p, "date", 10);
    if (!date.isEmpty())
      try {
        if (LocalDate.parse(date).isBefore(LocalDate.now(ZoneId.of("Asia/Kolkata"))))
          throw new IllegalArgumentException();
      } catch (Exception e) {
        throw ApiException.bad("Choose a valid future delivery date.");
      }
    int tip = Inputs.integer(p.getOrDefault("tip", 0), 0, 50, "tip");
    if (!Set.of(0, 20, 30, 50).contains(tip)) throw ApiException.bad("Invalid delivery tip.");
    return Map.of(
        "delivery",
        delivery,
        "date",
        date,
        "slot",
        Inputs.text(p, "slot", 100),
        "tip",
        tip,
        "gift",
        Boolean.TRUE.equals(p.get("gift")),
        "cutlery",
        Boolean.TRUE.equals(p.get("cutlery")),
        "rxAcknowledged",
        Boolean.TRUE.equals(p.get("rxAcknowledged")));
  }

  private void event(CommerceOrder o, String status) {
    o.events.add(Map.of("status", status, "created_at", Instant.now().toString()));
  }

  private Map<String, Double> deliveryCoordinates(Object value) {
    if (value == null)
      throw new ApiException(400, "DELIVERY_LOCATION_REQUIRED",
          "Choose a delivery location before confirming the order.");
    return Inputs.location(value, true);
  }

  public CommerceOrder deliveryLocation(Account a, String id, Object value) {
    CommerceOrder o = buyer(a, id);
    if (!Set.of("confirmed", "preparing", "ready").contains(o.status))
      throw new ApiException(409, "ORDER_STARTED", "The delivery location cannot change after pickup or cancellation.");
    if (o.location != null)
      throw new ApiException(409, "LOCATION_ALREADY_SET", "This order already has a delivery location.");
    Map<String, Double> location = deliveryCoordinates(value);
    if (Set.of("food", "fruits").contains(o.department)) {
      SellerProfile seller = mongo.findById(o.sellerId, SellerProfile.class);
      if (seller == null || seller.location == null || Inputs.distance(location, seller.location) > market.radius)
        throw new ApiException(400, "OUTSIDE_DELIVERY_AREA", "Choose a location within the store's delivery area.");
    }
    if (mongo.updateFirst(Query.query(where("_id").is(id).and("buyerId").is(a.id)
            .and("location").is(null).and("status").in("confirmed", "preparing", "ready")),
        new Update().set("location", location), CommerceOrder.class).getModifiedCount() != 1)
      throw new ApiException(409, "ORDER_CHANGED", "The order changed. Refresh and try again.");
    return require(id);
  }

  @Transactional
  public CommerceOrder cancel(Account a, String id) {
    CommerceOrder o = buyer(a, id);
    if (o.status.equals("cancelled")) return o;
    if (!o.status.equals("confirmed"))
      throw new ApiException(
          409,
          "ORDER_STARTED",
          "Preparation already started; this order cannot be cancelled here.");
    Query q =
        Query.query(where("_id").is(id).and("buyerId").is(a.id).and("status").is("confirmed"));
    if (mongo
            .updateFirst(
                q,
                new Update()
                    .set("status", "cancelled")
                    .push(
                        "events",
                        Map.of("status", "cancelled", "created_at", Instant.now().toString())),
                CommerceOrder.class)
            .getModifiedCount()
        != 1)
      throw new ApiException(
          409, "ORDER_CHANGED", "The order status changed. Refresh and try again.");
    for (Map<String, Object> line : o.items)
      mongo.updateFirst(
          Query.query(where("_id").is(line.get("id"))),
          new Update().inc("stock", ((Number) line.get("quantity")).intValue()),
          Product.class);
    return require(id);
  }

  public CommerceOrder status(Account a, String id, String status) {
    SellerProfile seller = market.seller(a);
    CommerceOrder o = require(id);
    if (!seller.id.equals(o.sellerId)) throw ApiException.missing();
    String from =
        status.equals("preparing") ? "confirmed" : status.equals("ready") ? "preparing" : "";
    if (!from.isEmpty() && o.status.equals(status)) return o;
    if (from.isEmpty() || !o.status.equals(from))
      throw new ApiException(409, "INVALID_STATUS", "Follow the order preparation sequence.");
    if (o.items.stream().anyMatch(i -> Boolean.TRUE.equals(i.get("rxRequired"))))
      throw new ApiException(
          409,
          "PHARMACIST_REVIEW_REQUIRED",
          "Prescription fulfilment requires pharmacist approval; connect that workflow first.");
    if (mongo
            .updateFirst(
                Query.query(
                    where("_id").is(id).and("sellerId").is(seller.id).and("status").is(from)),
                new Update()
                    .set("status", status)
                    .push(
                        "events", Map.of("status", status, "created_at", Instant.now().toString())),
                CommerceOrder.class)
            .getModifiedCount()
        != 1) {
      CommerceOrder current = require(id);
      if (current.status.equals(status)) return current;
      throw new ApiException(409, "ORDER_CHANGED", "Order status changed.");
    }
    return require(id);
  }

  public Map<String, Object> tracking(Account a, String id) {
    CommerceOrder o = buyer(a, id);
    Map<String, Object> r = new LinkedHashMap<>();
    r.put("order", o);
    Account driver = o.driverId == null ? null : mongo.findById(o.driverId, Account.class);
    r.put("driver", driver == null ? null : Map.of("name", driver.name));
    Map<String, Object> location =
        o.status.equals("out_for_delivery") && o.driverLocation != null
            ? new LinkedHashMap<>(o.driverLocation)
            : null;
    if (location != null)
      location.put(
          "stale",
          Instant.parse((String) location.get("recordedAt"))
              .isBefore(Instant.now().minusSeconds(30)));
    r.put("location", location);
    r.put("events", o.events);
    return r;
  }

  private void driver(Account a) {
    if (!"driver".equals(a.role))
      throw new ApiException(
          403, "DRIVER_REQUIRED", "Assigned delivery partner access is required.");
  }

  public List<Map<String, Object>> driverOrders(Account a) {
    driver(a);
    Criteria pickups = a.driverAvailable ? where("status").is("ready") : where("_id").is("__offline_no_pickups__");
    if (a.driverStoreId != null) pickups.and("sellerId").is(a.driverStoreId);
    List<CommerceOrder> orders = new ArrayList<>(
        mongo.find(
            Query.query(
                new Criteria().orOperator(pickups,
                    where("status").is("out_for_delivery").and("driverId").is(a.id)))
                .with(org.springframework.data.domain.Sort.by("date").descending()).limit(100),
            CommerceOrder.class));
    orders.addAll(mongo.find(Query.query(where("status").is("delivered").and("driverId").is(a.id))
        .with(org.springframework.data.domain.Sort.by("date").descending()).limit(30), CommerceOrder.class));
    Map<String, SellerProfile> pickupProfiles = new HashMap<>();
    return orders.stream()
        .map(
            o -> {
              Map<String, Object> m = new LinkedHashMap<>();
              m.put("id", o.id);
              m.put("status", o.status);
              m.put("items", o.items);
              m.put("store", driverPickupStore(o, pickupProfiles));
              m.put("department", o.department);
              m.put("date", o.date);
              m.put("preferences", o.preferences);
              m.put("paymentStatus", o.paymentStatus);
              m.put("deliveryLocationRequired", o.location == null);
              if (a.id.equals(o.driverId)) {
                m.put("address", o.address);
                m.put("location", o.location);
                m.put("amount", o.amount);
                m.put("driverLocation", o.status.equals("out_for_delivery") ? o.driverLocation : null);
                m.put("events", o.events);
              }
              return m;
            })
        .toList();
  }

  private Map<String, Object> driverPickupStore(CommerceOrder order, Map<String, SellerProfile> profiles) {
    if (order.store == null || order.store.get("location") != null || order.sellerId == null
        || "delivered".equals(order.status)) return order.store;
    // An order may predate the seller saving a pickup location. Fill the missing
    // map location from the store profile without replacing a saved order location.
    if (!profiles.containsKey(order.sellerId))
      profiles.put(order.sellerId, mongo.findById(order.sellerId, SellerProfile.class));
    SellerProfile seller = profiles.get(order.sellerId);
    if (seller == null || seller.location == null) return order.store;
    Map<String, Object> store = new LinkedHashMap<>(order.store);
    store.put("location", seller.location);
    return store;
  }

  @Transactional
  public CommerceOrder claim(Account a, String id) {
    driver(a);
    CommerceOrder o = require(id);
    if ("out_for_delivery".equals(o.status) && a.id.equals(o.driverId)) return o;
    if (a.driverStoreId != null && !a.driverStoreId.equals(o.sellerId))
      throw new ApiException(403, "FORBIDDEN", "This pickup belongs to another store.");
    if (!a.driverAvailable) throw new ApiException(409, "DRIVER_OFFLINE", "Go online before accepting a new pickup.");
    if (o.location == null)
      throw new ApiException(400, "DELIVERY_LOCATION_REQUIRED",
          "The buyer must add a delivery location in My orders before you can accept pickup.");
    if (!o.status.equals("ready"))
      throw new ApiException(
          409, "ORDER_CHANGED", "This pickup has already been assigned or is not ready.");
    if (mongo
            .updateFirst(
                Query.query(where("_id").is(id).and("status").is("ready")),
                new Update()
                    .set("status", "out_for_delivery")
                    .set("driverId", a.id)
                    .push(
                        "events",
                        Map.of(
                            "status", "out_for_delivery", "created_at", Instant.now().toString())),
                CommerceOrder.class)
            .getModifiedCount()
        != 1) {
      CommerceOrder current = require(id);
      if ("out_for_delivery".equals(current.status) && a.id.equals(current.driverId)) return current;
      throw new ApiException(409, "ORDER_CHANGED", "Pickup already assigned.");
    }
    return require(id);
  }

  public void location(Account a, String id, Map<String, Object> v) {
    driver(a);
    Map<String, Double> loc = Inputs.location(v, true);
    double accuracy = Inputs.number(v.get("accuracy"));
    if (accuracy < 0 || accuracy > 100000) throw ApiException.bad("Invalid GPS accuracy.");
    Map<String, Object> data = new LinkedHashMap<>(loc);
    data.put("accuracy", accuracy);
    data.put("recordedAt", Instant.now().toString());
    if (mongo
            .updateFirst(
                Query.query(
                    where("_id")
                        .is(id)
                        .and("driverId")
                        .is(a.id)
                        .and("status")
                        .is("out_for_delivery")),
                new Update().set("driverLocation", data),
                CommerceOrder.class)
            .getMatchedCount()
        != 1)
      throw new ApiException(
          403, "FORBIDDEN", "You can only share location for your active delivery.");
  }

  public CommerceOrder complete(Account a, String id, Map<String, Object> v) {
    driver(a);
    if (!Boolean.TRUE.equals(v.get("cashCollected")))
      throw ApiException.bad("Confirm cash collection before completing delivery.");
    CommerceOrder order = require(id);
    if (!a.id.equals(order.driverId))
      throw new ApiException(403, "FORBIDDEN", "Only the assigned driver can complete this delivery.");
    if ("delivered".equals(order.status) && "paid_cash".equals(order.paymentStatus)) return order;
    if (!"out_for_delivery".equals(order.status))
      throw new ApiException(409, "ORDER_CHANGED", "This order is not out for delivery.");
    if (mongo
            .updateFirst(
                Query.query(
                    where("_id")
                        .is(id)
                        .and("driverId")
                        .is(a.id)
                        .and("status")
                        .is("out_for_delivery")),
                new Update()
                    .set("status", "delivered")
                    .set("paymentStatus", "paid_cash")
                    .unset("driverLocation")
                    .push(
                        "events",
                        Map.of("status", "delivered", "created_at", Instant.now().toString())),
                CommerceOrder.class)
            .getModifiedCount()
        != 1) throw new ApiException(409, "ORDER_CHANGED", "Delivery status changed. Refresh.");
    return require(id);
  }
}
