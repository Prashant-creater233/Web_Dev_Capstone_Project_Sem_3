const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 150 },
    author: { type: String, required: [true, 'Author is required'], trim: true, maxlength: 100 },
    category: { type: String, required: [true, 'Category is required'], trim: true },
    isbn: { type: String, required: [true, 'ISBN is required'], unique: true, trim: true },
    description: { type: String, trim: true, maxlength: 600 },
    totalCopies: { type: Number, required: true, min: [1, 'At least 1 copy is needed'], validate: Number.isInteger },
    availableCopies: { type: Number, required: true, min: [0, 'Available copies cannot be negative'] },
  },
  { timestamps: true }
);

// Indexes: faster filtering by category, and title/author search + sorting
bookSchema.index({ category: 1 });
bookSchema.index({ title: 1, author: 1 });

module.exports = mongoose.model('Book', bookSchema);
