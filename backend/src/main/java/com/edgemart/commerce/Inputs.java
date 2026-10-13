package com.edgemart.commerce;

import java.util.*;

public final class Inputs {
  public static final Set<String> DEPARTMENTS =
      Set.of(
          "books",
          "electronics",
          "groceries",
          "fruits",
          "vegetables",
          "pharmacy",
          "plants",
          "meat",
          "jewellery",
          "food");

  public static String text(Map<String, ?> values, String key, int max) {
    Object v = values.get(key);
    if (v == null) return "";
    if (!(v instanceof String s) || s.length() > max)
      throw ApiException.bad("Invalid " + key + ".");
    return s.trim();
  }

  public static String required(Map<String, ?> values, String key, int min, int max) {
    String s = text(values, key, max);
    if (s.length() < min) throw ApiException.bad("Check " + key + ".");
    return s;
  }

  public static Map<String, Object> map(Object value) {
    if (!(value instanceof Map<?, ?> raw)) throw ApiException.bad("An object is required.");
    Map<String, Object> result = new LinkedHashMap<>();
    raw.forEach(
        (k, v) -> {
          if (!(k instanceof String)) throw ApiException.bad("Invalid field.");
          result.put((String) k, v);
        });
    return result;
  }

  public static int integer(Object v, int min, int max, String label) {
    try {
      int n = new java.math.BigDecimal(String.valueOf(v)).intValueExact();
      if (n < min || n > max) throw new IllegalArgumentException();
      return n;
    } catch (Exception e) {
      throw ApiException.bad("Check " + label + ".");
    }
  }

  public static String department(String value) {
    String d = value.toLowerCase(Locale.ROOT);
    if (!DEPARTMENTS.contains(d)) throw ApiException.bad("Choose a valid department.");
    return d;
  }

  public static Map<String, Double> location(Object value, boolean required) {
    if (value == null && !required) return null;
    Map<String, Object> m = map(value);
    double lat = number(m.get("lat")), lng = number(m.get("lng"));
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180)
      throw ApiException.bad("Enter valid coordinates.");
    return Map.of("lat", lat, "lng", lng);
  }

  public static double number(Object v) {
    if (!(v instanceof Number n) || !Double.isFinite(n.doubleValue()))
      throw ApiException.bad("Enter a finite number.");
    return n.doubleValue();
  }

  public static double distance(Map<String, Double> a, Map<String, Double> b) {
    double x = Math.toRadians(b.get("lat") - a.get("lat")),
        y = Math.toRadians(b.get("lng") - a.get("lng"));
    double h =
        Math.pow(Math.sin(x / 2), 2)
            + Math.cos(Math.toRadians(a.get("lat")))
                * Math.cos(Math.toRadians(b.get("lat")))
                * Math.pow(Math.sin(y / 2), 2);
    return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
  }
}
