package com.edgemart;
import static org.junit.jupiter.api.Assertions.*;
import com.edgemart.commerce.*;
import java.util.Map;
import org.junit.jupiter.api.Test;

class OrderWorkflowTest {
  final CommerceOrder order=new CommerceOrder();
  final SellerProfile seller=new SellerProfile();
  final MarketplaceService market=new MarketplaceService(null,5) {
    @Override public SellerProfile seller(Account a){return seller;}
  };
  final OrderService service=new OrderService(null,market) {
    @Override public CommerceOrder require(String id){return order;}
  };
  final Account account=new Account();
  OrderWorkflowTest(){account.id="driver";account.role="driver";seller.id="seller";order.sellerId=seller.id;order.driverId=account.id;order.location=Map.of("lat",13.08,"lng",80.27);}
  @Test void repeatedPreparationRequestsKeepTheCurrentStateWithoutAnotherWrite(){
    for(String state:new String[]{"preparing","ready"}){order.status=state;assertSame(order,service.status(account,"order",state));}
  }
  @Test void anotherStoreCannotReuseAnIdempotentStatusRequest(){
    order.status="preparing";order.sellerId="other-store";
    assertEquals(404,assertThrows(ApiException.class,()->service.status(account,"order","preparing")).status);
  }
  @Test void repeatedPickupAndCompletionBelongOnlyToTheAssignedDriver(){
    order.status="out_for_delivery";assertSame(order,service.claim(account,"order"));
    Account other=new Account();other.id="other";other.role="driver";
    assertEquals(409,assertThrows(ApiException.class,()->service.claim(other,"order")).status);
    order.status="delivered";order.paymentStatus="paid_cash";
    assertSame(order,service.complete(account,"order",Map.of("cashCollected",true)));
    assertEquals(403,assertThrows(ApiException.class,()->service.complete(other,"order",Map.of("cashCollected",true))).status);
  }
  @Test void forbiddenPreparationTransitionsStillFail(){
    order.status="delivered";
    assertEquals(409,assertThrows(ApiException.class,()->service.status(account,"order","preparing")).status);
  }
}
