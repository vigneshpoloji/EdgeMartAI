package com.edgemart;
import static org.junit.jupiter.api.Assertions.*;
import com.edgemart.commerce.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

class DriverQueueTest {
  Account driver() {Account a=new Account();a.id="driver";a.role="driver";return a;}
  CommerceOrder order(String id,String status,String driverId) {
    CommerceOrder o=new CommerceOrder();o.id=id;o.status=status;o.driverId=driverId;
    o.department="books";o.date="2026-10-12T07:35:00Z";
    o.preferences=Map.of("date","2026-10-13","slot","Morning","delivery","standard");
    o.address=Map.of("name","Test buyer","phone","9876543210");
    o.location=Map.of("lat",13.08,"lng",80.27);o.amount=Map.of("total",24800);
    o.driverLocation=Map.of("lat",13.081,"lng",80.27,"recordedAt",o.date,"accuracy",10);
    return o;
  }
  @Test void buyerDetailsAndGpsAreVisibleOnlyForAssignedOrders() {
    CommerceOrder ready=order("ready","ready",null),active=order("active","out_for_delivery","driver"),done=order("done","delivered","driver");
    MongoTemplate mongo=new MongoTemplate(OrderLocationTest.factory()) {
      @Override public <T> List<T> find(Query query,Class<T> type) {
        List<CommerceOrder> rows=query.getQueryObject().containsKey("$or")?List.of(ready,active):List.of(done);
        return rows.stream().map(type::cast).toList();
      }
    };
    var rows=new OrderService(mongo,null).driverOrders(driver());
    assertEquals(3,rows.size());
    assertFalse(rows.get(0).containsKey("address"));assertFalse(rows.get(0).containsKey("location"));assertFalse(rows.get(0).containsKey("driverLocation"));
    assertEquals(ready.preferences,rows.get(0).get("preferences"));
    assertEquals(active.address,rows.get(1).get("address"));assertEquals(active.driverLocation,rows.get(1).get("driverLocation"));
    assertEquals(done.address,rows.get(2).get("address"));assertNull(rows.get(2).get("driverLocation"));
  }
  @Test void ordinaryAccountsCannotLoadTheDriverWorkspace() {
    Account buyer=new Account();buyer.id="buyer";
    ApiException error=assertThrows(ApiException.class,()->new OrderService(null,null).driverOrders(buyer));
    assertEquals(403,error.status);
  }
  @Test void missingPickupMapsUseTheSellerLocationSavedAfterTheOrder() {
    CommerceOrder ready=order("ready","ready",null),active=order("active","out_for_delivery","driver"),saved=order("saved","ready",null);
    ready.sellerId=active.sellerId=saved.sellerId="seller";
    ready.store=new LinkedHashMap<>();ready.store.put("name","Order store name");ready.store.put("location",null);
    active.store=new LinkedHashMap<>(ready.store);
    var originalLocation=Map.of("lat",13.09,"lng",80.28);
    saved.store=Map.of("name","Saved pickup","location",originalLocation);
    SellerProfile seller=new SellerProfile();seller.id="seller";seller.location=Map.of("lat",13.08,"lng",80.27);
    int[] profileReads={0};
    MongoTemplate mongo=new MongoTemplate(OrderLocationTest.factory()) {
      @Override public <T> List<T> find(Query query,Class<T> type) {
        return (query.getQueryObject().containsKey("$or")?List.of(ready,active,saved):List.<CommerceOrder>of()).stream().map(type::cast).toList();
      }
      @Override public <T> T findById(Object id,Class<T> type) {profileReads[0]++;return type.cast(seller);}
    };
    var rows=new OrderService(mongo,null).driverOrders(driver());
    for(int index:List.of(0,1)){
      Map<?,?> store=(Map<?,?>)rows.get(index).get("store");
      assertEquals(seller.location,store.get("location"));assertEquals("Order store name",store.get("name"));
      assertEquals(Set.of("name","location"),store.keySet());
    }
    assertEquals(originalLocation,((Map<?,?>)rows.get(2).get("store")).get("location"));
    assertNull(ready.store.get("location"));assertNull(active.store.get("location"));
    assertEquals(1,profileReads[0]);
  }
}
