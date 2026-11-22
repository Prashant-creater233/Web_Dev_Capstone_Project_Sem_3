const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// PROTECTED ROUTE: user must send "Authorization: Bearer <accessToken>"
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new ApiError(401, 'Not logged in');

  const decoded = jwt.verify(header.split(' ')[1], config.accessSecret); // throws if invalid/expired
  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'User no longer exists');

  req.user = user;
  next();
});

// RBAC: allow only the listed roles, e.g. authorize('librarian', 'admin')
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, `Role '${req.user.role}' is not allowed to do this`));
  }
  next();
};

module.exports = { protect, authorize };
