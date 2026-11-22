const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

// Refresh tokens are stored hashed in the DB, like passwords (SHA-256 is enough for long random tokens)
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const signAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, config.accessSecret, { expiresIn: config.accessExpires });

const signRefreshToken = (user) =>
  jwt.sign({ id: user._id, jti: crypto.randomUUID() }, config.refreshSecret, { expiresIn: config.refreshExpires });

// Creates both tokens and saves the refresh token hash on the user (token rotation)
const issueTokens = async (user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await User.findByIdAndUpdate(user._id, { refreshToken: hashToken(refreshToken) });
  return { accessToken, refreshToken };
};

module.exports = { hashToken, issueTokens };
