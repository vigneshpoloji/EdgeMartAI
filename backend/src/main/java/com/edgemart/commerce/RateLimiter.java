package com.edgemart.commerce;

import java.util.*;
import org.springframework.stereotype.Component;

@Component
public class RateLimiter {
  private final Map<String, Deque<Long>> buckets = new HashMap<>();
  private final Map<String, Deque<Reservation>> reservations = new HashMap<>();

  /** Reserve quota before a side effect; close releases it unless the effect succeeded. */
  public synchronized Reservation reserve(String key, int limit, long window) {
    long now = System.currentTimeMillis();
    reservations.entrySet().removeIf(e -> e.getValue().isEmpty() || e.getValue().peekLast().created <= now - 3600000);
    if (reservations.size() >= 20000 && !reservations.containsKey(key))
      throw new ApiException(429, "RATE_LIMITED", "Please wait before trying again.");
    Deque<Reservation> queue = reservations.computeIfAbsent(key, k -> new ArrayDeque<>());
    while (!queue.isEmpty() && queue.peekFirst().created <= now - window) queue.removeFirst();
    if (queue.size() >= limit)
      throw new ApiException(429, "RATE_LIMITED", "Please wait before sending another message.");
    Reservation slot = new Reservation(key, now); queue.addLast(slot); return slot;
  }

  public final class Reservation implements AutoCloseable {
    private final String key;
    private final long created;
    private boolean committed, closed;
    private Reservation(String key, long created) { this.key = key; this.created = created; }
    public void commit() {
      synchronized (RateLimiter.this) { if (!closed) committed = true; }
    }
    @Override public void close() {
      synchronized (RateLimiter.this) {
        if (closed) return;
        closed = true;
        if (!committed) {
          Deque<Reservation> queue = reservations.get(key);
          if (queue != null) { queue.remove(this); if (queue.isEmpty()) reservations.remove(key); }
        }
      }
    }
  }

  public synchronized void check(String key, int limit, long window) {
    long now = System.currentTimeMillis();
    buckets
        .entrySet()
        .removeIf(e -> e.getValue().isEmpty() || e.getValue().peekLast() < now - 3600000);
    if (buckets.size() > 20000)
      throw new ApiException(429, "RATE_LIMITED", "Please wait before trying again.");
    Deque<Long> q = buckets.computeIfAbsent(key, k -> new ArrayDeque<>());
    while (!q.isEmpty() && q.peekFirst() <= now - window) q.removeFirst();
    if (q.size() >= limit)
      throw new ApiException(429, "RATE_LIMITED", "Please wait before trying again.");
    q.addLast(now);
  }
}
