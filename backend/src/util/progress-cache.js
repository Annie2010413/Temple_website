const { TtlCache } = require("./cache");

const progressCache = new TtlCache({ ttlMs: 10_000 });

function invalidateProgressCache(userId) {
  if (userId) progressCache.delete(String(userId));
}

module.exports = { progressCache, invalidateProgressCache };
