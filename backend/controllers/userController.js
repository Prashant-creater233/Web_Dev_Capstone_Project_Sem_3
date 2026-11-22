const User = require('../models/User');
const IssueRecord = require('../models/IssueRecord');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// The admin account lives in .env, so nobody can be made admin through the API
const ASSIGNABLE_ROLES = ['librarian', 'student'];
const checkRole = (role) => {
  if (!ASSIGNABLE_ROLES.includes(role)) {
    throw new ApiError(400, 'Role must be librarian or student. The admin account is set in the .env file and cannot be created here.');
  }
};

// GET /api/users?role=student  (librarian, admin)
exports.getUsers = asyncHandler(async (req, res) => {
  const filter = ['student', 'librarian', 'admin'].includes(req.query.role) ? { role: req.query.role } : {};
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ users: users.map((u) => u.toSafe()) });
});

// POST /api/users  (admin) - the only way to create librarians
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, rollNo } = req.body;
  checkRole(role);
  const user = await User.create({ name, email, password, role, rollNo });
  res.status(201).json({ user: user.toSafe() });
});

// PATCH /api/users/:id/role  (admin)
exports.updateRole = asyncHandler(async (req, res) => {
  checkRole(req.body.role);
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(400, 'The admin account cannot be changed');
  user.role = req.body.role;
  await user.save();
  res.json({ user: user.toSafe() });
});

// DELETE /api/users/:id  (admin)
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(400, 'The admin account cannot be deleted');
  const active = await IssueRecord.countDocuments({ student: user._id, status: 'issued' });
  if (active > 0) throw new ApiError(400, 'This user still has issued books');
  await user.deleteOne();
  res.json({ message: 'User deleted' });
});
