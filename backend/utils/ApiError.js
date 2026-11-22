// Error with an HTTP status code. The error middleware turns it into a JSON response.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}
module.exports = ApiError;
