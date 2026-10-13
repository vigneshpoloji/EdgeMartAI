package com.edgemart.commerce;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class RegistrationService {
  private final AccountService accounts;
  private final MarketplaceService market;
  public RegistrationService(AccountService accounts,MarketplaceService market){this.accounts=accounts;this.market=market;}
  @Transactional public Account signup(Map<String,Object> values,String ip){
    Account account=accounts.signup(values,ip);
    if(values.containsKey("sellerProfile"))market.profile(account,Inputs.map(values.get("sellerProfile")));
    return account;
  }
}
