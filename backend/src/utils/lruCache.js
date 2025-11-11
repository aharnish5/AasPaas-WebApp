// Simple LRU cache with TTL for backend usage (autocomplete results, details lookups)
// Not production-hard; for higher scale use Redis.
export default class LRUCache {
  constructor(maxEntries = 200, defaultTtlMs = 5 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.defaultTtlMs = defaultTtlMs;
    this.map = new Map(); // key -> { value, expires }
  }

  _now() { return Date.now(); }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (this._now() > entry.expires) {
      this.map.delete(key);
      return null;
    }
    // refresh LRU ordering
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expires: this._now() + ttlMs });
    if (this.map.size > this.maxEntries) {
      // delete oldest (first inserted)
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
  }
}