const config = require('../config');
const Book = require('../models/Book');
const User = require('../models/User');
const IssueRecord = require('../models/IssueRecord');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { calcFine, daysLate, DAY_MS } = require('../utils/fine');

// Adds live "currentFine" / "daysLate" for books that are still issued and overdue
const withLiveFine = (record) => {
  const r = record.toObject();
  if (r.status === 'issued') {
    r.daysLate = daysLate(r.dueDate);
    r.currentFine = calcFine(r.dueDate);
  }
  return r;
};

// POST /api/issues  (librarian, admin)   body: { bookId, studentEmail }
exports.issueBook = asyncHandler(async (req, res) => {
  const { bookId, studentEmail } = req.body;
  if (!bookId || !studentEmail) throw new ApiError(400, 'bookId and studentEmail are required');

  const student = await User.findOne({ email: studentEmail.toLowerCase(), role: 'student' });
  if (!student) throw new ApiError(404, 'No student found with this email');

  const activeCount = await IssueRecord.countDocuments({ student: student._id, status: 'issued' });
  if (activeCount >= config.maxBooks) throw new ApiError(400, `Student already has ${config.maxBooks} books issued (limit reached)`);

  const already = await IssueRecord.findOne({ student: student._id, book: bookId, status: 'issued' });
  if (already) throw new ApiError(409, 'Student already has a copy of this book');

  // Atomic stock update: only decrements if a copy is available (safe even if two librarians click together)
  const book = await Book.findOneAndUpdate({ _id: bookId, availableCopies: { $gt: 0 } }, { $inc: { availableCopies: -1 } }, { new: true });
  if (!book) {
    const exists = await Book.exists({ _id: bookId });
    throw new ApiError(exists ? 400 : 404, exists ? 'No copies available right now' : 'Book not found');
  }

  try {
    const issueDate = new Date();
    const record = await IssueRecord.create({
      book: book._id,
      student: student._id,
      issuedBy: req.user._id,
      issueDate,
      dueDate: new Date(issueDate.getTime() + config.loanDays * DAY_MS),
    });
    res.status(201).json({ record });
  } catch (err) {
    await Book.findByIdAndUpdate(book._id, { $inc: { availableCopies: 1 } }); // undo stock change
    throw err;
  }
});

// PUT /api/issues/:id/return  (librarian, admin)
exports.returnBook = asyncHandler(async (req, res) => {
  const returnDate = new Date();
  const record = await IssueRecord.findById(req.params.id);
  if (!record) throw new ApiError(404, 'Issue record not found');

  const fine = calcFine(record.dueDate, returnDate);

  // Only flips if still "issued" -> a book can never be returned twice
  const updated = await IssueRecord.findOneAndUpdate(
    { _id: record._id, status: 'issued' },
    { status: 'returned', returnDate, fine, finePaid: fine === 0 },
    { new: true }
  );
  if (!updated) throw new ApiError(400, 'This book was already returned');

  await Book.findByIdAndUpdate(record.book, { $inc: { availableCopies: 1 } }); // stock goes back up
  res.json({ record: updated, message: fine > 0 ? `Returned late. Fine: Rs ${fine}` : 'Returned on time' });
});

// PUT /api/issues/:id/pay-fine  (librarian, admin)
exports.payFine = asyncHandler(async (req, res) => {
  const record = await IssueRecord.findOneAndUpdate({ _id: req.params.id, status: 'returned' }, { finePaid: true }, { new: true });
  if (!record) throw new ApiError(404, 'Returned record not found');
  res.json({ record });
});

// GET /api/issues?status=issued|returned&page=1&limit=10  (librarian, admin)
exports.getIssues = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const filter = {};
  if (['issued', 'returned'].includes(req.query.status)) filter.status = req.query.status;

  const total = await IssueRecord.countDocuments(filter);
  const records = await IssueRecord.find(filter)
    .populate('book', 'title author category')
    .populate('student', 'name email rollNo')
    .sort({ issueDate: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ records: records.map(withLiveFine), page, pages: Math.ceil(total / limit) || 1, total });
});

// GET /api/issues/my  (any logged-in user, mostly students) - dashboard data
exports.getMyIssues = asyncHandler(async (req, res) => {
  const records = (await IssueRecord.find({ student: req.user._id }).populate('book', 'title author category').sort({ issueDate: -1 })).map(withLiveFine);

  const totalDue = records.reduce((sum, r) => {
    if (r.status === 'issued') return sum + (r.currentFine || 0); // overdue and not yet returned
    return sum + (r.fine > 0 && !r.finePaid ? r.fine : 0); // returned late, fine not paid
  }, 0);

  res.json({
    current: records.filter((r) => r.status === 'issued'),
    history: records.filter((r) => r.status === 'returned'),
    totalDue,
    limits: { maxBooks: config.maxBooks, loanDays: config.loanDays, finePerDay: config.finePerDay },
  });
});
