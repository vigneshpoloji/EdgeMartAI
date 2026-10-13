package com.edgemart.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebsiteController {
  @GetMapping({"/", "/delivery", "/delivery/login", "/delivery/signup"})
  public String website(HttpServletRequest request) {
    return request.getRequestURI().equals("/") && request.getQueryString() == null
        ? "forward:/landing.html" : "forward:/index.html";
  }
}
