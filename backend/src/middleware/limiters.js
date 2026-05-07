const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

const sharedOptions = {
  standardHeaders: true,
  legacyHeaders: false
};

function userKey(req) {
  if (req.user?.userId) return `user:${req.user.userId}`;
  return ipKeyGenerator(req.ip);
}

const generalLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 60 * 1000,
  max: 120,
  message: { error: "Too many requests, please slow down." }
});

const authLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: { error: "Too many auth attempts, please try again later." }
});

const submitLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 60 * 1000,
  max: 12,
  keyGenerator: userKey,
  message: { error: "Too many submissions, please slow down." }
});

const progressReadLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: userKey,
  message: { error: "Too many progress reads, please slow down." }
});

const progressWriteLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: userKey,
  message: { error: "Too many progress updates, please slow down." }
});

module.exports = {
  generalLimiter,
  authLimiter,
  submitLimiter,
  progressReadLimiter,
  progressWriteLimiter
};
