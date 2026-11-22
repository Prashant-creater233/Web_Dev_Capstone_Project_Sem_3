const router = require('express').Router();
const c = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/auth');
const { requireFields } = require('../middleware/validate');

router.use(protect); // every book route needs login

router.get('/', c.getBooks);
router.get('/categories', c.getCategories); // must be above '/:id'
router.get('/:id', c.getBook);

// RBAC: only librarian/admin can change the catalogue
router.post('/', authorize('librarian', 'admin'), requireFields('title', 'author', 'category', 'isbn', 'totalCopies'), c.createBook);
router.put('/:id', authorize('librarian', 'admin'), c.updateBook);
router.delete('/:id', authorize('librarian', 'admin'), c.deleteBook);

module.exports = router;
