const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // unique index
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: { type: String, required: [true, 'Password is required'], minlength: [6, 'Password must be at least 6 characters'], select: false },
    role: { type: String, enum: ['student', 'librarian', 'admin'], default: 'student' },
    rollNo: { type: String, trim: true }, // only meaningful for students
    refreshToken: { type: String, select: false }, // SHA-256 hash of the current refresh token
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

// Hash the password with bcrypt before saving (only when it was changed)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// What we are allowed to send to the frontend
userSchema.methods.toSafe = function () {
  return { id: this._id, name: this.name, email: this.email, role: this.role, rollNo: this.rollNo };
};

module.exports = mongoose.model('User', userSchema);
