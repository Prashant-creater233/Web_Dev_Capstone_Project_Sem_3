const Book = require('../models/Book');
const IssueRecord = require('../models/IssueRecord');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SORTABLE = ['title', 'author', 'createdAt', 'availableCopies'];

// GET /api/books?q=&category=&available=true&sort=title&order=asc&page=1&limit=8
exports.getBooks = asyncHandler(async (req, res) => {
  const { q, category, available, sort = 'title', order = 'asc' } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 8));

  const filter = {};
  if (q) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [{ title: rx }, { author: rx }]; // search by title OR author
  }
  if (category) filter.category = category;
  if (available === 'true') filter.availableCopies = { $gt: 0 };

  const sortField = SORTABLE.includes(sort) ? sort : 'title';
  const total = await Book.countDocuments(filter);
  const books = await Book.find(filter)
    .sort({ [sortField]: order === 'desc' ? -1 : 1 })
    .skip((page - 1) * limit) // pagination
    .limit(limit);

  res.json({ books, page, pages: Math.ceil(total / limit) || 1, total });
});

// GET /api/books/categories
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Book.distinct('category');
  res.json({ categories: categories.sort() });
});

// GET /api/books/:id
exports.getBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw new ApiError(404, 'Book not found');
  res.json({ book });
});

// POST /api/books  (librarian, admin)
exports.createBook = asyncHandler(async (req, res) => {
  const { title, author, category, isbn, description, totalCopies } = req.body;
  const book = await Book.create({ title, author, category, isbn, description, totalCopies, availableCopies: totalCopies });
  res.status(201).json({ book });
});

// PUT /api/books/:id  (librarian, admin)
exports.updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw new ApiError(404, 'Book not found');

  const { title, author, category, isbn, description, totalCopies } = req.body;

  if (totalCopies !== undefined && Number(totalCopies) !== book.totalCopies) {
    const issuedNow = book.totalCopies - book.availableCopies; // copies currently with students
    if (Number(totalCopies) < issuedNow) {
      throw new ApiError(400, `${issuedNow} copies are currently issued, total copies cannot be less than that`);
    }
    book.totalCopies = Number(totalCopies);
    book.availableCopies = Number(totalCopies) - issuedNow;
  }
  Object.assign(book, Object.fromEntries(Object.entries({ title, author, category, isbn, description }).filter(([, v]) => v !== undefined)));

  await book.save(); // runs the schema validation
  res.json({ book });
});

// DELETE /api/books/:id  (librarian, admin)
exports.deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw new ApiError(404, 'Book not found');

  const active = await IssueRecord.countDocuments({ book: book._id, status: 'issued' });
  if (active > 0) throw new ApiError(400, 'This book is currently issued, so it cannot be deleted');

  await book.deleteOne();
  res.json({ message: 'Book deleted' });
});
