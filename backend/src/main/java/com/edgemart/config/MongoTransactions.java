package com.edgemart.config;

import com.edgemart.commerce.CommerceOrder;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.*;
import org.springframework.data.mongodb.*;
import org.springframework.data.mongodb.core.MongoTemplate;

@Configuration
public class MongoTransactions {
  @Bean
  MongoTransactionManager transactions(MongoDatabaseFactory factory) {
    return new MongoTransactionManager(factory);
  }

  @Bean
  ApplicationRunner initializeOrderCollection(MongoTemplate mongo) {
    return args -> {
      if (!mongo.collectionExists(CommerceOrder.class)) mongo.createCollection(CommerceOrder.class);
    };
  }
}
