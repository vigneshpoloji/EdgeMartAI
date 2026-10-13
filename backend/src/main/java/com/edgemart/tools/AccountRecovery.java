package com.edgemart.tools;

import com.edgemart.commerce.AccountService;
import com.edgemart.commerce.ApiException;
import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClients;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;
import com.mongodb.client.model.Updates;
import java.io.Console;
import java.util.Arrays;
import java.util.Locale;
import java.util.Properties;
import java.util.concurrent.TimeUnit;
import org.bson.Document;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.core.io.FileSystemResource;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/** Local operator tool. No HTTP endpoint and no password command-line argument. */
public final class AccountRecovery {
  public static void main(String[] args) {
    try {
      run(args);
    } catch (ApiException error) {
      System.err.println(error.getMessage());
      System.exit(1);
    } catch (IllegalArgumentException | IllegalStateException error) {
      System.err.println(error.getMessage());
      System.exit(1);
    } catch (Exception error) {
      // Driver exception messages can include private connection configuration.
      System.err.println("Recovery could not finish. Check Atlas connectivity and database permissions.");
      System.exit(1);
    }
  }

  private static void run(String[] args) {
    if (org.slf4j.LoggerFactory.getLogger("org.mongodb.driver") instanceof ch.qos.logback.classic.Logger logger)
      logger.setLevel(ch.qos.logback.classic.Level.OFF);
    if (args.length != 2 || !Arrays.asList("--check", "--reset").contains(args[0]))
      throw new IllegalArgumentException("Usage: AccountRecovery --check|--reset email");
    String email = args[1].trim().toLowerCase(Locale.ROOT);
    if (!email.matches("[^\\s@{}]+@[^\\s@{}]+\\.[^\\s@{}]+"))
      throw new IllegalArgumentException("Enter the actual email address without template braces.");
    boolean reset = args[0].equals("--reset");
    Console console = System.console();
    if (reset && console == null)
      throw new IllegalStateException("Run this command yourself in an interactive terminal to enter a hidden password.");

    Properties local = new Properties();
    var file = new FileSystemResource("application-local.yml");
    if (file.exists()) {
      var yaml = new YamlPropertiesFactoryBean();
      yaml.setResources(file);
      local = yaml.getObject();
    }
    String uri = System.getenv("MONGODB_URI");
    if (uri == null || uri.isBlank()) uri = local.getProperty("spring.data.mongodb.uri");
    if (uri == null || uri.isBlank() || uri.contains("${"))
      throw new IllegalStateException("Set MONGODB_URI or the local backend database URI before running recovery.");
    ConnectionString connection;
    try { connection = new ConnectionString(uri); }
    catch (IllegalArgumentException error) {
      throw new IllegalStateException("The configured MongoDB URI is invalid.");
    }
    String database = System.getenv("SPRING_DATA_MONGODB_DATABASE");
    if (database == null || database.isBlank())
      database = local.getProperty("spring.data.mongodb.database", connection.getDatabase());
    if (database == null || database.isBlank())
      throw new IllegalStateException("Specify the database name in the backend connection configuration.");

    var settings = MongoClientSettings.builder().applyConnectionString(connection)
        .applyToClusterSettings(builder -> builder.serverSelectionTimeout(10, TimeUnit.SECONDS))
        .applyToSocketSettings(builder -> builder.connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(10, TimeUnit.SECONDS)).build();
    try (var client = MongoClients.create(settings)) {
      var accounts = client.getDatabase(database).getCollection("accounts");
      var matches = accounts.find(Filters.eq("email", email))
          .projection(Projections.include("_id", "email", "passwordHash", "sessionVersion"))
          .limit(2).into(new java.util.ArrayList<>());
      if (matches.size() != 1)
        throw new IllegalStateException(matches.isEmpty()
            ? "No account found for that exact email. No records were changed."
            : "Multiple accounts use that email. No records were changed.");
      Document account = matches.get(0);
      System.out.println("Account found: " + email);
      System.out.println("Password sign-in configured: " + (account.get("passwordHash") instanceof String hash && !hash.isBlank()));
      if (!reset) {
        System.out.println("Check complete. No records were changed.");
        return;
      }

      System.out.println("This will reset this account's password and invalidate its old sessions.");
      String confirmation = console.readLine("Type the account email to continue: ");
      if (!email.equals(confirmation == null ? "" : confirmation.trim().toLowerCase(Locale.ROOT)))
        throw new IllegalStateException("Email confirmation did not match. No records were changed.");
      char[] first = console.readPassword("New password (hidden): ");
      char[] second = null;
      try {
        if (first == null) throw new IllegalStateException("Cancelled. No records were changed.");
        second = console.readPassword("Confirm new password (hidden): ");
        if (second == null || !Arrays.equals(first, second))
          throw new IllegalStateException("Passwords did not match. No records were changed.");
        String password = AccountService.validatedPassword(new String(first));
        String encoded = new BCryptPasswordEncoder(12).encode(password);
        var result = accounts.updateOne(Filters.and(
            Filters.eq("_id", account.get("_id")), Filters.eq("email", email),
            Filters.eq("passwordHash", account.get("passwordHash")),
            Filters.eq("sessionVersion", account.get("sessionVersion"))),
            Updates.combine(Updates.set("passwordHash", encoded), Updates.inc("sessionVersion", 1)));
        if (result.getMatchedCount() != 1)
          throw new IllegalStateException("The account changed during recovery. No recovery update was applied; run again.");
        System.out.println("Password reset complete. Sign in with the same email and your new password.");
      } finally {
        if (first != null) Arrays.fill(first, '\0');
        if (second != null) Arrays.fill(second, '\0');
      }
    }
  }
}
