package com.edgemart;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication
@EnableMongoRepositories(basePackages = "com.edgemart.repository")
public class EdgeMartApplication {
    public static void main(String[] args) {
        SpringApplication.run(EdgeMartApplication.class, args);
    }
}