const mongoose = require('mongoose');
const config = require('./index');

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 });
  } catch (err) {
    console.error('\nCould not connect to MongoDB.');
    console.error(`MONGO_URI = ${config.mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
    console.error('Fix: 1) start MongoDB locally, OR 2) put a MongoDB Atlas connection string in backend/.env (see README).');
    if (/bad auth|authentication/i.test(err.message)) console.error('Hint: wrong database username or password in the Atlas URI.');
    if (/ENOTFOUND|querySrv/i.test(err.message)) console.error('Hint: check internet connection and the cluster address in the URI.');
    if (/ECONNREFUSED/i.test(err.message)) console.error('Hint: MongoDB is not running on this machine.');
    if (/whitelist|IP|Server selection timed out/i.test(err.message)) console.error('Hint: in Atlas > Network Access, allow your IP (0.0.0.0/0 for testing).');
    throw err;
  }
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
};

module.exports = connectDB;
