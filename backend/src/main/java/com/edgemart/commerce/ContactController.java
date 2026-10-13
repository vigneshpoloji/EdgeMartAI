package com.edgemart.commerce;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
public class ContactController {
  private final ContactMail mail;
  private final RateLimiter limiter;
  public ContactController(ContactMail mail, RateLimiter limiter) { this.mail = mail; this.limiter = limiter; }

  @PostMapping("/api/contact")
  public Map<String, String> contact(@RequestBody Map<String, Object> values, HttpServletRequest request) {
    mail.requireConfigured();
    // Invalid input/provider failures must not consume the three-email delivery quota.
    limiter.check("contact-attempt:" + request.getRemoteAddr(), 20, 600000);
    if (!Inputs.text(values, "website", 200).isBlank()) throw ApiException.bad("Please leave the website field empty.");
    String name = Inputs.required(values, "name", 2, 100);
    String email = Inputs.required(values, "email", 3, 254);
    String phone = Inputs.text(values, "phone", 30);
    String message = Inputs.required(values, "message", 5, 3000);
    if (name.matches("(?s).*[\\p{Cntrl}].*") || !email.matches("[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\\.[A-Za-z]{2,63}")
        || (!phone.isBlank() && !phone.matches("[+0-9 ()-]{6,30}")))
      throw ApiException.bad("Check your name, email and phone number.");
    // This cap reserves most of the free email allowance. Visitors cannot choose recipients.
    try (var visitor = limiter.reserve("contact-ip:" + request.getRemoteAddr(), 3, 600000);
         var total = limiter.reserve("contact-total", 30, 3600000)) {
      mail.send(name, email, phone, message);
      visitor.commit(); total.commit();
    }
    return Map.of("message", "Your message was accepted for email delivery. Thank you for getting in touch.");
  }
}
