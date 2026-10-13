package com.edgemart.config;
import com.edgemart.commerce.*;
import org.springframework.context.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
@Configuration
public class ImportedCatalogue {
 @Bean ApplicationRunner importConfiguredCatalogue(MongoTemplate mongo, MarketplaceService market,
     @Value("${edgemart.import-owner-id:}") String accountId) {
   return args -> {
     if (accountId.isBlank()) return;
     Account account = mongo.findById(accountId, Account.class);
     if (account == null) return;
     try { market.importExisting(account, market.seller(account)); }
     catch (ApiException error) { if (!error.code.equals("SELLER_REQUIRED")) throw error; }
   };
 }
}
