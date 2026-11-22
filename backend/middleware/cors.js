const config = require('../config');

const allowedOrigins = [
  'https://campuslibrary-db0e2vdeh-prashant-creator.vercel.app',
  'https://campuslibrary-tau.vercel.app',
  'https://campuslibrary-18l9e0t1m-prashant-creator.vercel.app',
  'https://campuslibrary-lecx4bet0-prashant-creator.vercel.app',
  config.clientUrl
].filter(Boolean);

module.exports = (req, res, next) => {
  const origin = req.headers.origin;

  if (
    allowedOrigins.includes(origin) ||
    (origin && /^https:\/\/campuslibrary-[a-z0-9]+-prashant-creator\.vercel\.app$/.test(origin))
  ) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
};