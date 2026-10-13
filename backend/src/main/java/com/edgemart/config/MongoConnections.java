package com.edgemart.config;

import java.util.concurrent.TimeUnit;
import org.springframework.boot.autoconfigure.mongo.MongoClientSettingsBuilderCustomizer;
import org.springframework.context.annotation.*;

@Configuration
public class MongoConnections {
  @Bean
  public MongoClientSettingsBuilderCustomizer resilientConnections() {
    return builder -> builder
        .applyToConnectionPoolSettings(pool -> pool.maxSize(20).minSize(0)
            .maxConnectionIdleTime(60, TimeUnit.SECONDS)
            .maintenanceFrequency(15, TimeUnit.SECONDS)
            .maxWaitTime(8, TimeUnit.SECONDS))
        // Atlas DNS/TLS discovery can outlast eight seconds on a slow connection.
        .applyToClusterSettings(cluster -> cluster.serverSelectionTimeout(30, TimeUnit.SECONDS));
  }
}
