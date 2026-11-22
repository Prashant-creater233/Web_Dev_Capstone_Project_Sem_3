const ApiError = require('../utils/ApiError');

// Reusable: requireFields('email', 'password') -> 400 if any is missing or empty
const requireFields = (...fields) => (req, res, next) => {
  const body = req.body || {};
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || String(body[f]).trim() === '');
  if (missing.length) return next(new ApiError(400, `Missing required field(s): ${missing.join(', ')}`));
  next();
};

module.exports = { requireFields };
