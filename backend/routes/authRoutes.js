const router = require('express').Router();
const c = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { requireFields } = require('../middleware/validate');
const rateLimit = require('../middleware/rateLimit');

const loginLimiter = rateLimit(30, 15 * 60 * 1000); // brute-force protection

router.post('/register', requireFields('name', 'email', 'password'), c.register);
router.post('/login', loginLimiter, requireFields('email', 'password'), c.login);
router.post('/refresh', requireFields('refreshToken'), c.refresh);
router.post('/logout', protect, c.logout);
router.get('/me', protect, c.me);

module.exports = router;
