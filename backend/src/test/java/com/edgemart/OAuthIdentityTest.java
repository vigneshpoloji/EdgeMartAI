package com.edgemart;
import static org.junit.jupiter.api.Assertions.*;
import com.edgemart.commerce.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
class OAuthIdentityTest {
  @Test void passwordAccountsRequireAuthenticatedLinkingAndCanConnectMultipleProviders(){
    Account password=new Account();password.id="password-account";password.email="person@example.test";password.passwordHash="existing-hash";
    List<Account> records=new ArrayList<>(List.of(password));
    MongoTemplate mongo=new MongoTemplate(OrderLocationTest.factory()){
      @Override public <T>T findOne(Query query,Class<T> type){var q=query.getQueryObject();if(q.containsKey("email"))return records.stream().filter(a->a.email.equals(q.getString("email"))).findFirst().map(type::cast).orElse(null);var branches=(List<?>)q.get("$or");String identity=((org.bson.Document)branches.get(0)).getString("oauthIdentity");return records.stream().filter(a->identity.equals(a.oauthIdentity)||a.oauthIdentities.contains(identity)).findFirst().map(type::cast).orElse(null);}
      @Override public <T>T save(T value){return value;}
    };
    AccountService accounts=new AccountService(mongo,new RateLimiter());
    assertEquals("ACCOUNT_LINK_REQUIRED",assertThrows(ApiException.class,()->accounts.oauth("google:subject","person@example.test","Person")).code);
    assertEquals("ACCOUNT_LINK_MISMATCH",assertThrows(ApiException.class,()->accounts.oauth("google:subject","different@example.test","Person",password)).code);
    assertTrue(password.oauthIdentities.isEmpty());
    assertSame(password,accounts.oauth("google:subject","person@example.test","Person",password));
    assertSame(password,accounts.oauth("github:subject","person@example.test","Person",password));
    assertSame(password,accounts.oauth("google:subject","changed@example.test","Person"));
    assertEquals("existing-hash",password.passwordHash);assertEquals(2,password.oauthIdentities.size());
    Account other=new Account();other.id="other-account";
    assertEquals("OAUTH_IDENTITY_CONFLICT",assertThrows(ApiException.class,()->accounts.oauth("google:subject","person@example.test","Person",other)).code);
  }
}
