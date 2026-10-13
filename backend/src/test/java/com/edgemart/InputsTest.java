package com.edgemart;

import static org.junit.jupiter.api.Assertions.*;

import com.edgemart.commerce.*;
import java.util.Map;
import org.junit.jupiter.api.Test;

class InputsTest {
  @Test
  void coordinatesAndRadius() {
    var chennai = Inputs.location(Map.of("lat", 13.0827, "lng", 80.2707), true);
    assertEquals(0, Inputs.distance(chennai, chennai), .00001);
    assertTrue(Inputs.distance(chennai, Inputs.location(Map.of("lat", 12, "lng", 80), true)) > 5);
    assertThrows(ApiException.class, () -> Inputs.location(Map.of("lat", 91, "lng", 0), true));
    assertThrows(
        ApiException.class, () -> Inputs.location(Map.of("lat", Double.NaN, "lng", 0), true));
  }

  @Test
  void numberAndDepartmentValidation() {
    assertThrows(ApiException.class, () -> Inputs.integer(1.5, 0, 99, "stock"));
    assertThrows(ApiException.class, () -> Inputs.integer(-1, 0, 99, "stock"));
    assertEquals("books", Inputs.department("Books"));
    assertThrows(ApiException.class, () -> Inputs.department("invalid"));
  }
}
