const config = require('./config');
const connectDB = require('./config/db');
const ensureAdmin = require('./utils/bootstrapAdmin');
const app = require('./app');

if (!config.accessSecret || !config.refreshSecret) {
  console.error('Missing JWT_ACCESS_SECRET / JWT_REFRESH_SECRET in .env');
  process.exit(1);
}

connectDB()
  .then(ensureAdmin) // the admin account comes from .env
  .then(() => app.listen(config.port, () => console.log(`API running on http://localhost:${config.port}`)))
  .catch((err) => {
    console.error('Could not start server:', err.message);
    process.exit(1);
  });
