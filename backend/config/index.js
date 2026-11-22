// One place that reads every environment variable (loaded from .env by dotenv)
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_library',
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpires: process.env.ACCESS_EXPIRES || '15m',
  refreshExpires: process.env.REFRESH_EXPIRES || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  loanDays: Number(process.env.LOAN_DAYS) || 14,
  finePerDay: Number(process.env.FINE_PER_DAY) || 5,
  maxBooks: Number(process.env.MAX_BOOKS_PER_STUDENT) || 3,
  // The ONLY admin account. It is created/updated from these values every time the server starts.
  adminName: process.env.ADMIN_NAME || 'Library Admin',
  adminEmail: (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || '',
};
