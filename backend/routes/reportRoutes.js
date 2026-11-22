const router = require('express').Router();
const c = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('librarian', 'admin'));

router.get('/summary', c.summary);
router.get('/most-borrowed', c.mostBorrowed);
router.get('/overdue', c.overdue);

module.exports = router;
