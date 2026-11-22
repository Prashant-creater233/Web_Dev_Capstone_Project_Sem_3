const ApiError = require('../utils/ApiError');

// Small in-memory rate limiter (custom middleware, no extra package).
// rateLimit(30, 15 * 60 * 1000) -> max 30 requests per 15 minutes per IP
const rateLimit = (max, windowMs) => {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const entry = hits.get(req.ip);
    if (!entry || now > entry.resetAt) {
      hits.set(req.ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) return next(new ApiError(429, 'Too many attempts, please try again later'));
    next();
  };
};

module.exports = rateLimit;
