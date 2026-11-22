const User = require('../models/User');
const config = require('../config');

// Makes sure exactly ONE admin exists and that it matches ADMIN_EMAIL / ADMIN_PASSWORD from .env.
// Runs every time the server starts (and from `npm run seed`).
module.exports = async function ensureAdmin() {
  if (!config.adminEmail || !config.adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in backend/.env');
  }
  if (config.adminPassword.length < 6) throw new Error('ADMIN_PASSWORD must be at least 6 characters');

  let admin = await User.findOne({ email: config.adminEmail }).select('+password');

  if (!admin) {
    admin = await User.create({ name: config.adminName, email: config.adminEmail, password: config.adminPassword, role: 'admin' });
    console.log(`Admin account created: ${config.adminEmail}`);
  } else {
    let changed = false;
    if (admin.role !== 'admin') { admin.role = 'admin'; changed = true; }
    if (!(await admin.matchPassword(config.adminPassword))) {
      admin.password = config.adminPassword; // hashed by the pre-save hook
      admin.refreshToken = undefined; // old sessions stop working after a password change
      changed = true;
    }
    if (changed) {
      await admin.save();
      console.log('Admin account updated from .env');
    }
  }

  // Nobody else may be an admin
  const demoted = await User.updateMany({ role: 'admin', _id: { $ne: admin._id } }, { role: 'librarian' });
  if (demoted.modifiedCount) console.log(`${demoted.modifiedCount} other admin account(s) were changed to librarian`);

  return admin;
};
