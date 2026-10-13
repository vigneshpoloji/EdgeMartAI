package com.edgemart;

import static org.junit.jupiter.api.Assertions.*;
import com.edgemart.commerce.*;
import java.util.Map;
import java.lang.reflect.Proxy;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.MongoExceptionTranslator;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.UpdateDefinition;
import org.junit.jupiter.api.Test;

class OrderLocationTest {
  final CommerceOrder order = new CommerceOrder();
  final MemoryMongo mongo = new MemoryMongo();
  final OrderService service = new OrderService(mongo, null) {
    @Override public CommerceOrder require(String id) { return order; }
  };
  final Account buyer = new Account();
  final Map<String, Double> location = Map.of("lat", 13.0827, "lng", 80.2707);

  OrderLocationTest() {
    buyer.id = "buyer";
    order.buyerId = buyer.id;
    order.status = "ready";
    order.department = "books";
  }

  @Test void onlyTheOrderBuyerCanSupplyCoordinates() {
    Account other = new Account();
    other.id = "other";
    ApiException error = assertThrows(ApiException.class, () -> service.deliveryLocation(other, "order", location));
    assertEquals(404, error.status);
  }

  @Test void existingLocationsCannotBeReplaced() {
    order.location = location;
    ApiException error = assertThrows(ApiException.class, () -> service.deliveryLocation(buyer, "order", location));
    assertEquals("LOCATION_ALREADY_SET", error.code);
  }

  @Test void pickedUpOrClosedOrdersCannotChangeLocation() {
    for (String status : new String[]{"out_for_delivery", "delivered", "cancelled"}) {
      order.status = status;
      ApiException error = assertThrows(ApiException.class, () -> service.deliveryLocation(buyer, "order", location));
      assertEquals(409, error.status);
    }
  }

  @Test void invalidCoordinatesAreRejectedBeforeDatabaseWrites() {
    for (Object value : new Object[]{null, Map.of(), Map.of("lat", 91, "lng", 80), Map.of("lat", 13, "lng", Double.NaN), Map.of("lat", "13", "lng", 80)}) {
      ApiException error = assertThrows(ApiException.class, () -> service.deliveryLocation(buyer, "order", value));
      assertEquals(400, error.status);
    }
  }

  @Test void newOrdersNeedCoordinatesBeforeAnyInventoryAccess() {
    ApiException error = assertThrows(ApiException.class, () -> service.create(buyer, Map.of("idempotencyKey", "new-order-test")));
    assertEquals("DELIVERY_LOCATION_REQUIRED", error.code);
  }

  @Test void driverCannotPickUpAnOrderWithoutCoordinates() {
    Account driver = new Account();
    driver.id = "driver";
    driver.role = "driver";
    ApiException error = assertThrows(ApiException.class, () -> service.claim(driver, "order"));
    assertEquals("DELIVERY_LOCATION_REQUIRED", error.code);
  }

  @Test void repairsOnlyTheMissingLocationAndKeepsBuyerAndStatusInTheAtomicFilter() {
    for (String status : new String[]{"confirmed", "preparing", "ready"}) {
      order.status = status;
      assertSame(order, service.deliveryLocation(buyer, "order", location));
      var filter = mongo.query.getQueryObject();
      assertEquals("order", filter.get("_id"));
      assertEquals(buyer.id, filter.get("buyerId"));
      assertTrue(filter.containsKey("location"));
      assertNull(filter.get("location"));
      assertTrue(filter.containsKey("status"));
      assertEquals(Map.of("$set", Map.of("location", location)), mongo.update.getUpdateObject());
    }
  }

  @Test void aConcurrentOrderChangeIsReportedInsteadOfOverwritingIt() {
    mongo.modified = 0;
    ApiException error = assertThrows(ApiException.class, () -> service.deliveryLocation(buyer, "order", location));
    assertEquals("ORDER_CHANGED", error.code);
  }

  static MongoDatabaseFactory factory() {
    MongoDatabase database = (MongoDatabase) Proxy.newProxyInstance(MongoDatabase.class.getClassLoader(), new Class[]{MongoDatabase.class},
        (proxy, method, args) -> switch (method.getName()) {
          case "getName" -> "unit_test";
          case "getCodecRegistry" -> MongoClientSettings.getDefaultCodecRegistry();
          default -> throw new UnsupportedOperationException(method.getName());
        });
    return (MongoDatabaseFactory) Proxy.newProxyInstance(MongoDatabaseFactory.class.getClassLoader(), new Class[]{MongoDatabaseFactory.class},
        (proxy, method, args) -> switch (method.getName()) {
          case "getMongoDatabase" -> database;
          case "getExceptionTranslator" -> new MongoExceptionTranslator();
          case "getCodecRegistry" -> MongoClientSettings.getDefaultCodecRegistry();
          case "isTransactionActive" -> false;
          default -> throw new UnsupportedOperationException(method.getName());
        });
  }

  static class MemoryMongo extends MongoTemplate {
    Query query;
    UpdateDefinition update;
    long modified = 1;
    MemoryMongo() { super(factory()); }
    @Override public <T> T findOne(Query query, Class<T> type) { return null; }
    @Override public UpdateResult updateFirst(Query query, UpdateDefinition update, Class<?> type) {
      this.query = query;
      this.update = update;
      return UpdateResult.acknowledged(modified, modified, null);
    }
  }
}
