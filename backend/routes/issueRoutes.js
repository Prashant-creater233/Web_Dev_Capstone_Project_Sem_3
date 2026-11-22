const router = require('express').Router();
const c = require('../controllers/issueController');
const { protect, authorize } = require('../middleware/auth');
const { requireFields } = require('../middleware/validate');

router.use(protect);

router.get('/my', c.getMyIssues); // student dashboard
router.get('/', authorize('librarian', 'admin'), c.getIssues);
router.post('/', authorize('librarian', 'admin'), requireFields('bookId', 'studentEmail'), c.issueBook);
router.put('/:id/return', authorize('librarian', 'admin'), c.returnBook);
router.put('/:id/pay-fine', authorize('librarian', 'admin'), c.payFine);

module.exports = router;
