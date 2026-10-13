package com.edgemart.commerce;

import java.util.Map;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
public class HealthController {
  private final MongoTemplate mongo;
  public HealthController(MongoTemplate mongo) { this.mongo = mongo; }
  @GetMapping("/api/health/live")
  public Map<String, String> live() { return Map.of("status", "ok"); }
  @GetMapping("/api/health")
  public Map<String, String> ready() {
    mongo.executeCommand(new Document("ping", 1));
    return Map.of("status", "ok", "database", "connected");
  }
}
