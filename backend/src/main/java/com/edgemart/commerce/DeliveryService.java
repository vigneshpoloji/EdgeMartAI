package com.edgemart.commerce;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import java.util.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class DeliveryService {
  private final MongoTemplate mongo;
  private final AccountService accounts;
  private final MarketplaceService market;
  private final RateLimiter limiter;
  public DeliveryService(MongoTemplate mongo,AccountService accounts,MarketplaceService market,RateLimiter limiter){this.mongo=mongo;this.accounts=accounts;this.market=market;this.limiter=limiter;}
  @Transactional
  public Account signup(Map<String,Object> values,String ip){
    limiter.check("driver-enrol:"+ip,20,3600000);
    Map<String,String> details=details(values);
    Account account=accounts.signup(values,ip);
    account.role="driver";account.driverPhone=details.get("phone");account.driverCity=details.get("city");account.driverVehicle=details.get("vehicle");
    return mongo.save(account);
  }
  private Map<String,String> details(Map<String,Object> values){
    String phone=Inputs.required(values,"phone",10,10);if(!phone.matches("[6-9][0-9]{9}"))throw ApiException.bad("Enter a valid Indian mobile number.");
    String city=Inputs.required(values,"city",2,100),vehicle=Inputs.required(values,"vehicle",3,30);
    if(!List.of("bicycle","motorcycle","car","van").contains(vehicle))throw ApiException.bad("Choose a delivery vehicle.");
    return Map.of("phone",phone,"city",city,"vehicle",vehicle);
  }
  public Map<String,Object> profile(Account account){
    Map<String,Object> profile=new LinkedHashMap<>();profile.put("name",account.name);profile.put("email",account.email);profile.put("phone",account.driverPhone==null?"":account.driverPhone);profile.put("city",account.driverCity==null?"":account.driverCity);profile.put("vehicle",account.driverVehicle==null?"motorcycle":account.driverVehicle);profile.put("available",account.driverAvailable);
    SellerProfile store=account.driverStoreId==null?null:mongo.findById(account.driverStoreId,SellerProfile.class);
    profile.put("store",store==null?"EdgeMart delivery network":store.store);return profile;
  }
  public Map<String,Object> update(Account account,Map<String,Object> values){
    Map<String,String> details=details(values);String name=Inputs.required(values,"name",2,100);
    if(!(values.get("available") instanceof Boolean available))throw ApiException.bad("Choose online or offline availability.");
    mongo.updateFirst(Query.query(where("_id").is(account.id).and("role").is("driver")),new Update().set("name",name).set("driverPhone",details.get("phone")).set("driverCity",details.get("city")).set("driverVehicle",details.get("vehicle")).set("driverAvailable",available),Account.class);
    return profile(mongo.findById(account.id,Account.class));
  }
  public Map<String,Object> availability(Account account,Map<String,Object> values){
    if(!(values.get("available") instanceof Boolean available))throw ApiException.bad("Choose online or offline availability.");
    mongo.updateFirst(Query.query(where("_id").is(account.id).and("role").is("driver")),new Update().set("driverAvailable",available),Account.class);
    return profile(mongo.findById(account.id,Account.class));
  }
  public List<Map<String,Object>> partners(Account operator){
    String sellerId=market.seller(operator).id;
    List<String> assigned=mongo.findDistinct(Query.query(where("sellerId").is(sellerId).and("driverId").ne(null)),"driverId",CommerceOrder.class,String.class);
    Criteria partners=new Criteria().orOperator(where("driverStoreId").is(sellerId),where("_id").in(assigned));
    return mongo.find(Query.query(new Criteria().andOperator(where("role").is("driver"),partners)).limit(100),Account.class).stream().map(this::profile).toList();
  }
}
