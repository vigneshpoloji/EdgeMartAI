package com.edgemart.commerce;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.*;
import org.springframework.stereotype.Component;

@Component
public class ContactMail {
  private static final String INBOX = "vigneshpoloji@gmail.com";
  private final ObjectMapper json;
  private final String key, sender;
  private final URI endpoint;
  private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build();

  @Autowired
  public ContactMail(ObjectMapper json, @Value("${edgemart.contact.key:}") String key,
      @Value("${edgemart.contact.sender:vigneshpoloji@gmail.com}") String sender) {
    this(json, key, sender, URI.create("https://api.brevo.com/v3/smtp/email"));
  }

  // Local provider contract tests do not send real email.
  public ContactMail(ObjectMapper json, String key, String sender, URI endpoint) {
    this.json = json; this.key = key; this.sender = sender; this.endpoint = endpoint;
  }

  public void requireConfigured() {
    if (key == null || key.isBlank() || key.startsWith("xsmtpsib-"))
      throw new ApiException(503, "CONTACT_NOT_CONFIGURED", "Email is being set up. Please use the direct email link below.");
  }

  public void send(String name, String email, String phone, String message) {
    requireConfigured();
    var payload = Map.of(
        "sender", Map.of("name", "EdgeMart website", "email", sender),
        "to", List.of(Map.of("email", INBOX)),
        "replyTo", Map.of("name", name, "email", email),
        "subject", "EdgeMart website: question or feedback",
        "textContent", "Name: " + name + "\nEmail: " + email + "\nPhone / WhatsApp: "
            + (phone.isBlank() ? "Not provided" : phone) + "\n\n" + message);
    try {
      var request = HttpRequest.newBuilder(endpoint).timeout(Duration.ofSeconds(8))
          .header("api-key", key).header("Content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(payload))).build();
      var reply = http.send(request, HttpResponse.BodyHandlers.ofString());
      if (reply.statusCode() == 201 && !json.readTree(reply.body()).path("messageId").asText().isBlank()) return;
      // Never include provider bodies, submitted messages or credentials in logs/responses.
      org.slf4j.LoggerFactory.getLogger(ContactMail.class).warn("Contact email provider returned HTTP {}", reply.statusCode());
      throw new ApiException(503, "CONTACT_UNAVAILABLE", "Email could not be accepted. Please try later or use the direct email link.");
    } catch (ApiException error) { throw error;
    } catch (InterruptedException error) {
      Thread.currentThread().interrupt(); throw unavailable();
    } catch (Exception error) { throw unavailable(); }
  }

  private static ApiException unavailable() {
    return new ApiException(503, "CONTACT_UNAVAILABLE", "Email could not be confirmed. Please use the direct email link if needed.");
  }
}
