const DEFAULT_TTL_MS = 10_000;
const MAX_ENTRIES = 5_000;

class TtlCache {
  constructor({ ttlMs = DEFAULT_TTL_MS, max = MAX_ENTRIES } = {}) {
    this.ttlMs = ttlMs;
    this.max = max;
    this.store = new Map();
  }

  _now() {
    return Date.now();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this._now()) {
      this.store.delete(key);
      return undefined;
    }
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs) {
    if (this.store.size >= this.max) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) this.store.delete(oldestKey);
    }
    const ttl = typeof ttlMs === "number" ? ttlMs : this.ttlMs;
    this.store.set(key, { value, expiresAt: this._now() + ttl });
  }

  delete(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

module.exports = { TtlCache };
