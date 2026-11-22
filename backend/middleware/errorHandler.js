// 404 for unknown routes
const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

// Centralised error handler: every error in the app ends up here
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Server error';

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON in request body';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.code === 11000) {
    status = 409;
    // field name: newer MongoDB sends keyValue/keyPattern, older ones only a text message
    const field = Object.keys(err.keyValue || err.keyPattern || {})[0] || (/index: (?:\S+\.\$)?(\w+?)_\d/.exec(err.message) || [])[1] || 'value';
    message = `${field} already exists`;
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'jwt expired';
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  }

  if (status === 500) console.error(err);
  res.status(status).json({ success: false, message });
};

module.exports = { notFound, errorHandler };
