package com.edgemart;

import static org.junit.jupiter.api.Assertions.*;
import com.edgemart.commerce.AccountService;
import com.edgemart.commerce.ApiException;
import org.junit.jupiter.api.Test;

class PasswordValidationTest {
  @Test
  void signupAndRecoveryAcceptTheExactPasswordWithoutTrimming() {
    String value = " Example!2026 ";
    assertEquals(value, AccountService.validatedPassword(value));
    assertEquals("Aa1!" + "a".repeat(68), AccountService.validatedPassword("Aa1!" + "a".repeat(68)));
  }

  @Test
  void strengthAndBcryptByteLimitApplyToRecoveryToo() {
    for (Object value : new Object[] {123, "short", "lowercase1!", "UPPERCASE1!", "NoNumbers!!", "NoSymbols2026", "Aa1!" + "a".repeat(69), "Aa1!" + "é".repeat(35)})
      assertThrows(ApiException.class, () -> AccountService.validatedPassword(value));
    assertThrows(ApiException.class, () -> AccountService.validatedPassword(null));
  }
}
