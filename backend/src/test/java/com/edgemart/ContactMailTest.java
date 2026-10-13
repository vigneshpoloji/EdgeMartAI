package com.edgemart;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.edgemart.commerce.*;
import com.fasterxml.jackson.databind.*;
import com.sun.net.httpserver.HttpServer;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.*;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ContactMailTest {
  @Test void submissionUsesTheOwnerInboxVisitorReplyToAndHeaderKey() throws Exception {
    var json = new ObjectMapper(); var payload = new AtomicReference<JsonNode>();
    var key = new AtomicReference<String>();
    var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext("/mail", request -> {
      payload.set(json.readTree(request.getRequestBody())); key.set(request.getRequestHeaders().getFirst("api-key"));
      byte[] reply = "{\"messageId\":\"test-id\"}".getBytes(StandardCharsets.UTF_8);
      request.sendResponseHeaders(201, reply.length); request.getResponseBody().write(reply); request.close();
    }); server.start();
    try {
      var mail = new ContactMail(json, "private-test-key", "verified@example.com", URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/mail"));
      var mvc = MockMvcBuilders.standaloneSetup(new ContactController(mail, new RateLimiter())).setControllerAdvice(new ApiErrors()).build();
      mvc.perform(post("/api/contact").contentType("application/json").content("{\"name\":\"Visitor\",\"email\":\"visitor@example.com\",\"phone\":\"9876543210\",\"message\":\"A question <script>sample</script>\",\"to\":\"attacker@example.com\"}"))
          .andExpect(status().isOk()).andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("accepted")));
      assertEquals("private-test-key", key.get());
      assertEquals("vigneshpoloji@gmail.com", payload.get().path("to").path(0).path("email").asText());
      assertEquals("visitor@example.com", payload.get().path("replyTo").path("email").asText());
      assertEquals("verified@example.com", payload.get().path("sender").path("email").asText());
      assertTrue(payload.get().path("textContent").asText().contains("<script>sample</script>"));
      assertFalse(payload.get().has("htmlContent")); assertFalse(payload.get().toString().contains("private-test-key"));
    } finally { server.stop(0); }
  }

  @Test void missingConfigurationNeverClaimsEmailWasSent() {
    var mail = new ContactMail(new ObjectMapper(), "", "sender@example.com", URI.create("http://127.0.0.1:1"));
    assertEquals("CONTACT_NOT_CONFIGURED", assertThrows(ApiException.class, () -> mail.send("Visitor", "visitor@example.com", "", "Hello")).code);
  }

  @Test void smtpKeysAreRejectedBeforeAnyHttpEmailRequest() {
    var mail = new ContactMail(new ObjectMapper(), "xsmtpsib-dummy-test-credential", "sender@example.com", URI.create("http://127.0.0.1:1"));
    var error = assertThrows(ApiException.class, () -> mail.send("Visitor", "visitor@example.com", "", "Hello"));
    assertEquals("CONTACT_NOT_CONFIGURED", error.code);
    assertFalse(error.getMessage().contains("xsmtpsib"));
  }

  @Test void providerFailureDoesNotLeakItsResponseOrRetryAnEmail() throws Exception {
    var calls = new AtomicInteger(); var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext("/mail", request -> { calls.incrementAndGet(); byte[] body = "secret-test-key private provider information".getBytes(StandardCharsets.UTF_8);
      request.sendResponseHeaders(403, body.length); request.getResponseBody().write(body); request.close(); }); server.start();
    try {
      var mail = new ContactMail(new ObjectMapper(), "secret-test-key", "sender@example.com", URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/mail"));
      var error = assertThrows(ApiException.class, () -> mail.send("Visitor", "visitor@example.com", "", "Hello"));
      assertEquals("CONTACT_UNAVAILABLE", error.code); assertEquals(1, calls.get()); assertFalse(error.getMessage().contains("secret-test-key"));
    } finally { server.stop(0); }
  }

  @Test void invalidReplyAddressesBotsAndSubmissionBurstsAreRejectedBeforeSending() throws Exception {
    var calls = new AtomicInteger();
    var mail = new ContactMail(new ObjectMapper(), "test-key", "sender@example.com", URI.create("http://127.0.0.1:1")) {
      @Override public void send(String name, String email, String phone, String message) { calls.incrementAndGet(); }
    };
    var mvc = MockMvcBuilders.standaloneSetup(new ContactController(mail, new RateLimiter())).setControllerAdvice(new ApiErrors()).build();
    for (String body : new String[] {
        "{\"name\":\"Visitor\",\"email\":\"visitor@example.com\\r\\nBcc: other@example.com\",\"message\":\"Hello\"}",
        "{\"name\":\"Visitor\",\"email\":\"visitor@example.com\",\"message\":\"Hello\",\"website\":\"spam\"}",
        "{\"name\":\"Visitor\",\"email\":\"visitor@example.com\",\"message\":\"\"}"})
      mvc.perform(post("/api/contact").contentType("application/json").content(body)).andExpect(status().isBadRequest());
    for (int i = 0; i < 17; i++) mvc.perform(post("/api/contact").contentType("application/json").content("{}"))
        .andExpect(status().isBadRequest());
    mvc.perform(post("/api/contact").contentType("application/json").content("{}"))
        .andExpect(status().isTooManyRequests()); assertEquals(0, calls.get());
  }

  @Test void missingSetupAndProviderFailuresDoNotExhaustDeliveryQuota() throws Exception {
    String body = "{\"name\":\"Visitor\",\"email\":\"visitor@example.com\",\"message\":\"Hello there\"}";
    var missing = new ContactMail(new ObjectMapper(), "", "sender@example.com", URI.create("http://127.0.0.1:1"));
    var unconfigured = MockMvcBuilders.standaloneSetup(new ContactController(missing, new RateLimiter())).setControllerAdvice(new ApiErrors()).build();
    for (int i = 0; i < 5; i++) unconfigured.perform(post("/api/contact").contentType("application/json").content(body))
        .andExpect(status().isServiceUnavailable()).andExpect(jsonPath("$.code").value("CONTACT_NOT_CONFIGURED"));
    var calls = new AtomicInteger();
    var recovering = new ContactMail(new ObjectMapper(), "test-key", "sender@example.com", URI.create("http://127.0.0.1:1")) {
      @Override public void send(String name, String email, String phone, String message) {
        if (calls.incrementAndGet() <= 4) throw new ApiException(503, "CONTACT_UNAVAILABLE", "Test failure");
      }
    };
    var mvc = MockMvcBuilders.standaloneSetup(new ContactController(recovering, new RateLimiter())).setControllerAdvice(new ApiErrors()).build();
    for (int i = 0; i < 4; i++) mvc.perform(post("/api/contact").contentType("application/json").content(body))
        .andExpect(status().isServiceUnavailable());
    for (int i = 0; i < 3; i++) mvc.perform(post("/api/contact").contentType("application/json").content(body)).andExpect(status().isOk());
    mvc.perform(post("/api/contact").contentType("application/json").content(body)).andExpect(status().isTooManyRequests());
    assertEquals(7, calls.get());
  }

  @Test void releasingAConcurrentReservationDoesNotReleaseCommittedQuota() {
    var limiter = new RateLimiter();
    var successful = limiter.reserve("same-ip", 2, 600000);
    var failed = limiter.reserve("same-ip", 2, 600000);
    assertThrows(ApiException.class, () -> limiter.reserve("same-ip", 2, 600000));
    successful.commit(); successful.close(); failed.close(); failed.close();
    try (var next = limiter.reserve("same-ip", 2, 600000)) {
      assertThrows(ApiException.class, () -> limiter.reserve("same-ip", 2, 600000));
      next.commit();
    }
    assertThrows(ApiException.class, () -> limiter.reserve("same-ip", 2, 600000));
  }
}
