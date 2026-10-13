package com.edgemart;

import static org.junit.jupiter.api.Assertions.*;
import com.edgemart.commerce.*;
import java.util.Map;
import org.junit.jupiter.api.Test;

class OrderCompletionTest {
  final CommerceOrder order = new CommerceOrder();
  final OrderService service = new OrderService(null, null) {
    @Override public CommerceOrder require(String id) { return order; }
  };

  Account driver(String id) {
    Account account = new Account();
    account.id = id;
    account.role = "driver";
    order.driverId = "assigned-driver";
    order.status = "out_for_delivery";
    return account;
  }

  @Test void buyerCannotConfirmDelivery() {
    Account buyer = new Account();
    buyer.id = "buyer";
    ApiException error = assertThrows(ApiException.class,
        () -> service.complete(buyer, "order", Map.of("cashCollected", true)));
    assertEquals(403, error.status);
  }

  @Test void cashCollectionMustBeExplicitlyConfirmed() {
    Account driver = driver("assigned-driver");
    for (Object value : new Object[] {false, "true", 1}) {
      ApiException error = assertThrows(ApiException.class,
          () -> service.complete(driver, "order", Map.of("cashCollected", value)));
      assertEquals(400, error.status);
    }
  }

  @Test void anotherDriverCannotConfirmDelivery() {
    ApiException error = assertThrows(ApiException.class,
        () -> service.complete(driver("other-driver"), "order", Map.of("cashCollected", true)));
    assertEquals(403, error.status);
  }

  @Test void onlyActiveDeliveriesCanBeCompleted() {
    Account driver = driver("assigned-driver");
    for (String status : new String[] {"ready", "confirmed", "cancelled", "delivered"}) {
      order.status = status;
      ApiException error = assertThrows(ApiException.class,
          () -> service.complete(driver, "order", Map.of("cashCollected", true)));
      assertEquals(409, error.status);
    }
  }
}
