package com.edgemart.commerce;

import java.util.Map;
import org.springframework.dao.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class ApiErrors {
  @ExceptionHandler(ApiException.class)
  ResponseEntity<?> api(ApiException e) {
    return ResponseEntity.status(e.status).body(Map.of("code", e.code, "message", e.getMessage()));
  }

  @ExceptionHandler(DuplicateKeyException.class)
  ResponseEntity<?> duplicate() {
    return ResponseEntity.status(409)
        .body(
            Map.of(
                "code",
                "CONFLICT",
                "message",
                "This record already exists. Refresh and try again."));
  }

  @ExceptionHandler({
    HttpMessageNotReadableException.class,
    org.springframework.web.bind.MissingServletRequestParameterException.class
  })
  ResponseEntity<?> malformed() {
    return ResponseEntity.badRequest()
        .body(Map.of("code", "INVALID_REQUEST", "message", "Check the request fields."));
  }

  @ExceptionHandler(OptimisticLockingFailureException.class)
  ResponseEntity<?> changed() {return ResponseEntity.status(409).body(Map.of("code","PRODUCT_CHANGED","message","This record changed while you were editing. Refresh before saving."));}

  @ExceptionHandler(DataAccessException.class)
  ResponseEntity<?> database() {
    return ResponseEntity.status(503)
        .body(
            Map.of(
                "code",
                "DATABASE_UNAVAILABLE",
                "message",
                "Database is temporarily unavailable. Please retry."));
  }
}
