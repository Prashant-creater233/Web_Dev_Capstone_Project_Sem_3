const mongoose = require('mongoose');

// One record = one book issued to one student (this is the relationship between Book and User)
const issueRecordSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date },
    status: { type: String, enum: ['issued', 'returned'], default: 'issued' },
    fine: { type: Number, default: 0, min: 0 },
    finePaid: { type: Boolean, default: true },
  },
  { timestamps: true }
);

issueRecordSchema.index({ student: 1, status: 1 }); // student dashboard, "max books" check
issueRecordSchema.index({ status: 1, dueDate: 1 }); // overdue report

module.exports = mongoose.model('IssueRecord', issueRecordSchema);
