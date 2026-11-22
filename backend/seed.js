// Run once:  npm run seed
// Creates the admin account from .env and 12 sample books (only if the catalogue is empty).
// There are NO demo librarian/student accounts: the admin creates librarians, students register themselves.
require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./config');
const Book = require('./models/Book');
const ensureAdmin = require('./utils/bootstrapAdmin');

const books = [
  ['Introduction to Algorithms', 'Thomas H. Cormen', 'Computer Science', '9780262046305', 4],
  ['Clean Code', 'Robert C. Martin', 'Computer Science', '9780132350884', 3],
  ['Database System Concepts', 'Abraham Silberschatz', 'Computer Science', '9780078022159', 5],
  ['Operating System Concepts', 'Abraham Silberschatz', 'Computer Science', '9781119800361', 3],
  ['Artificial Intelligence: A Modern Approach', 'Stuart Russell', 'Computer Science', '9780134610993', 2],
  ['Engineering Mathematics', 'B. S. Grewal', 'Mathematics', '9788193328491', 6],
  ['Concepts of Physics', 'H. C. Verma', 'Physics', '9788177091878', 4],
  ['Wings of Fire', 'A. P. J. Abdul Kalam', 'Biography', '9788173711466', 3],
  ['The Discovery of India', 'Jawaharlal Nehru', 'History', '9780143031031', 2],
  ['Atomic Habits', 'James Clear', 'Self Help', '9781847941831', 3],
  ['Rich Dad Poor Dad', 'Robert T. Kiyosaki', 'Finance', '9781612680194', 2],
  ['The Alchemist', 'Paulo Coelho', 'Fiction', '9780061122415', 4],
];

(async () => {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 });
  await ensureAdmin();

  if ((await Book.countDocuments()) === 0) {
    await Book.insertMany(books.map(([title, author, category, isbn, n]) => ({ title, author, category, isbn, totalCopies: n, availableCopies: n })));
    console.log('12 sample books added');
  }

  console.log(`Seed complete. Log in as admin with ${config.adminEmail} and the ADMIN_PASSWORD from backend/.env`);
  await mongoose.disconnect();
})().catch((e) => { console.error('Seed failed:', e.message); process.exit(1); });
