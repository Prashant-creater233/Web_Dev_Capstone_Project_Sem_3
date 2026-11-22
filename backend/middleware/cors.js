const config = require('../config');

module.exports = (req, res, next) => {
  const allowedOrigin = config.clientUrl;

  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
};