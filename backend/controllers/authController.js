const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { issueTokens, hashToken } = require('../utils/tokens');

// POST /api/auth/register  (public) - always creates a STUDENT
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, rollNo } = req.body;
  const user = await User.create({ name, email, password, rollNo, role: 'student' });
  const tokens = await issueTokens(user);
  res.status(201).json({ user: user.toSafe(), ...tokens });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw new ApiError(401, 'Invalid email or password');

  const tokens = await issueTokens(user);
  res.json({ user: user.toSafe(), ...tokens });
});

// POST /api/auth/refresh  - exchange a valid refresh token for a new pair
exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, 'Refresh token is required');

  const decoded = jwt.verify(refreshToken, config.refreshSecret);
  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== hashToken(refreshToken)) throw new ApiError(401, 'Refresh token is not valid anymore');

  const tokens = await issueTokens(user); // rotation: old refresh token stops working
  res.json({ user: user.toSafe(), ...tokens });
});

// POST /api/auth/logout  (protected) - forget the refresh token
exports.logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafe() });
});
