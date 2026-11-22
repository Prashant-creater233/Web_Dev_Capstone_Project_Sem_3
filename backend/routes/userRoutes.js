const router = require('express').Router();
const c = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { requireFields } = require('../middleware/validate');

router.use(protect);

// Librarians may list students (to issue books); only admin can manage users
router.get('/', authorize('librarian', 'admin'), c.getUsers);
router.post('/', authorize('admin'), requireFields('name', 'email', 'password', 'role'), c.createUser);
router.patch('/:id/role', authorize('admin'), requireFields('role'), c.updateRole);
router.delete('/:id', authorize('admin'), c.deleteUser);

module.exports = router;
