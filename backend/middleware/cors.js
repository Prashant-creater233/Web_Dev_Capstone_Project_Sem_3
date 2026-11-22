const config = require('../config');

// Tiny hand-written CORS middleware (so we do not need an extra package)
module.exports = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', config.clientUrl);
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
};
