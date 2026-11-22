const Book = require('../models/Book');
const User = require('../models/User');
const IssueRecord = require('../models/IssueRecord');
const config = require('../config');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/reports/most-borrowed?limit=5
// AGGREGATION: group issue records by book, count, sort, join with the books collection
exports.mostBorrowed = asyncHandler(async (req, res) => {
  const limit = Math.min(20, parseInt(req.query.limit) || 5);
  const data = await IssueRecord.aggregate([
    { $group: { _id: '$book', timesBorrowed: { $sum: 1 } } },
    { $sort: { timesBorrowed: -1 } },
    { $limit: limit },
    { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
    { $unwind: '$book' },
    { $project: { _id: 0, bookId: '$book._id', title: '$book.title', author: '$book.author', category: '$book.category', timesBorrowed: 1 } },
  ]);
  res.json({ data });
});

// GET /api/reports/overdue
// AGGREGATION: issued books past due date, with student + book details and the fine so far
exports.overdue = asyncHandler(async (req, res) => {
  const now = new Date();
  const data = await IssueRecord.aggregate([
    { $match: { status: 'issued', dueDate: { $lt: now } } },
    { $lookup: { from: 'books', localField: 'book', foreignField: '_id', as: 'book' } },
    { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'student' } },
    { $unwind: '$book' },
    { $unwind: '$student' },
    { $addFields: { daysLate: { $ceil: { $divide: [{ $subtract: [now, '$dueDate'] }, 86400000] } } } },
    { $addFields: { fine: { $multiply: ['$daysLate', config.finePerDay] } } },
    { $sort: { daysLate: -1 } },
    { $project: { _id: 1, dueDate: 1, daysLate: 1, fine: 1, title: '$book.title', studentName: '$student.name', studentEmail: '$student.email', rollNo: '$student.rollNo' } },
  ]);
  res.json({ data });
});

// GET /api/reports/summary - numbers for the top of the reports page
exports.summary = asyncHandler(async (req, res) => {
  const now = new Date();
  const [stock, issuedNow, overdueNow, students, returned] = await Promise.all([
    Book.aggregate([{ $group: { _id: null, titles: { $sum: 1 }, copies: { $sum: '$totalCopies' }, available: { $sum: '$availableCopies' } } }]),
    IssueRecord.countDocuments({ status: 'issued' }),
    IssueRecord.countDocuments({ status: 'issued', dueDate: { $lt: now } }),
    User.countDocuments({ role: 'student' }),
    IssueRecord.aggregate([{ $match: { status: 'returned' } }, { $group: { _id: null, finesCollected: { $sum: { $cond: ['$finePaid', '$fine', 0] } } } }]),
  ]);
  const s = stock[0] || { titles: 0, copies: 0, available: 0 };
  res.json({
    titles: s.titles,
    totalCopies: s.copies,
    availableCopies: s.available,
    issuedNow,
    overdueNow,
    students,
    finesCollected: returned[0]?.finesCollected || 0,
  });
});
