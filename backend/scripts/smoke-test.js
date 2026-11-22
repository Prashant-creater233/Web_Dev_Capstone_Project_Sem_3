// End-to-end check of the whole API:  npm run seed  ->  npm run dev  ->  npm run smoke
// It logs in as the admin from .env, creates a temporary librarian and student, tests everything, then deletes them.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const config = require('../config');
const { calcFine } = require('../utils/fine');

const BASE = process.env.API_URL || `http://localhost:${config.port}/api`;
let passed = 0, failed = 0;

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
function check(name, cond, extra = '') {
  if (cond) { passed++; console.log(`PASS  ${name}`); }
  else { failed++; console.log(`FAIL  ${name} ${extra}`); }
}

(async () => {
  const stamp = Date.now();
  const libEmail = `smoke.lib.${stamp}@campus.edu`;
  const stuEmail = `smoke.stu.${stamp}@campus.edu`;
  const stu2Email = `smoke.stu2.${stamp}@campus.edu`;
  const pass = 'Smoke@123';

  // ---- fine calculation (pure function)
  const DAY = 86400000;
  check('fine: on time = 0', calcFine(new Date(Date.now() + DAY)) === 0);
  check('fine: 3 days late', calcFine(new Date(Date.now() - 3 * DAY + 1000)) === 3 * config.finePerDay);

  let r = await call('GET', '/health');
  check('health', r.status === 200);
  r = await call('GET', '/books');
  check('books without token -> 401', r.status === 401);

  // ---- admin comes only from .env
  r = await call('POST', '/auth/login', { body: { email: config.adminEmail, password: 'wrong-password' } });
  check('admin with wrong password -> 401', r.status === 401);
  r = await call('POST', '/auth/login', { body: { email: config.adminEmail } });
  check('login with missing password -> 400', r.status === 400);
  r = await call('POST', '/auth/login', { body: { email: config.adminEmail, password: config.adminPassword } });
  check('admin (from .env) login', r.status === 200 && r.data.user?.role === 'admin', JSON.stringify(r.data));
  const adm = r.data.accessToken;
  const adminId = r.data.user?.id;

  // ---- admin creates a librarian; nobody can become admin
  r = await call('POST', '/users', { token: adm, body: { name: 'Smoke Librarian', email: libEmail, password: pass, role: 'librarian' } });
  check('admin creates librarian -> 201', r.status === 201, JSON.stringify(r.data));
  const libId = r.data.user?.id;
  r = await call('POST', '/users', { token: adm, body: { name: 'Fake Admin', email: `fake.${stamp}@campus.edu`, password: pass, role: 'admin' } });
  check('cannot create another admin -> 400', r.status === 400);
  r = await call('PATCH', `/users/${libId}/role`, { token: adm, body: { role: 'admin' } });
  check('cannot promote anyone to admin -> 400', r.status === 400);
  r = await call('PATCH', `/users/${adminId}/role`, { token: adm, body: { role: 'student' } });
  check('cannot change the admin account -> 400', r.status === 400);
  r = await call('DELETE', `/users/${adminId}`, { token: adm });
  check('cannot delete the admin account -> 400', r.status === 400);
  r = await call('POST', '/auth/register', { body: { name: 'Sneaky', email: `sneaky.${stamp}@campus.edu`, password: pass, role: 'admin' } });
  check('register ignores role=admin (becomes student)', r.status === 201 && r.data.user.role === 'student');
  const sneakyId = r.data.user?.id;

  // ---- student registers himself
  r = await call('POST', '/auth/register', { body: { name: 'Smoke Student', email: stuEmail, password: pass, rollNo: '2501000099' } });
  check('student registers -> 201', r.status === 201 && r.data.user.role === 'student');
  const studentId = r.data.user?.id;
  r = await call('POST', '/auth/register', { body: { name: 'Smoke Student', email: stuEmail, password: pass } });
  check('duplicate email -> 409', r.status === 409);

  r = await call('POST', '/auth/login', { body: { email: libEmail, password: pass } });
  check('librarian login', r.status === 200 && r.data.user.role === 'librarian');
  const lib = r.data.accessToken, libRefresh = r.data.refreshToken;
  r = await call('POST', '/auth/login', { body: { email: stuEmail, password: pass } });
  check('student login', r.status === 200);
  const stu = r.data.accessToken;

  r = await call('GET', '/auth/me', { token: lib });
  check('me (protected route)', r.status === 200 && r.data.user.role === 'librarian');
  r = await call('POST', '/auth/refresh', { body: { refreshToken: libRefresh } });
  check('refresh token', r.status === 200 && r.data.accessToken);
  r = await call('POST', '/auth/refresh', { body: { refreshToken: libRefresh } });
  check('old refresh token rejected after rotation -> 401', r.status === 401);

  // ---- RBAC
  const isbn = String(Date.now());
  r = await call('POST', '/books', { token: stu, body: { title: 'x', author: 'y', category: 'z', isbn, totalCopies: 1 } });
  check('student cannot create book (RBAC) -> 403', r.status === 403);
  r = await call('POST', '/users', { token: lib, body: { name: 'A B', email: `a.${stamp}@b.co`, password: pass, role: 'librarian' } });
  check('librarian cannot create users -> 403', r.status === 403);
  r = await call('GET', '/reports/summary', { token: stu });
  check('student cannot see reports -> 403', r.status === 403);

  // ---- books
  r = await call('POST', '/books', { token: lib, body: { title: 'Smoke Test Book', author: 'Tester', category: 'Testing', isbn, totalCopies: 1 } });
  check('create book -> 201', r.status === 201, JSON.stringify(r.data));
  const bookId = r.data.book?._id;
  r = await call('POST', '/books', { token: lib, body: { title: 'Dup', author: 'T', category: 'Testing', isbn, totalCopies: 1 } });
  check('duplicate ISBN -> 409', r.status === 409);
  r = await call('POST', '/books', { token: lib, body: { title: 'Bad', author: 'T', category: 'Testing', isbn: isbn + '1', totalCopies: 0 } });
  check('validation error (0 copies) -> 400', r.status === 400);
  r = await call('GET', '/books?q=smoke&category=Testing&page=1&limit=5', { token: lib });
  check('search + filter + pagination', r.status === 200 && r.data.books.length === 1 && r.data.pages === 1);
  r = await call('GET', '/books/not-an-id', { token: lib });
  check('invalid id -> 400', r.status === 400);

  // ---- issue / return
  r = await call('POST', '/issues', { token: lib, body: { bookId, studentEmail: stuEmail } });
  check('issue book -> 201', r.status === 201, JSON.stringify(r.data));
  const issueId = r.data.record?._id;
  r = await call('GET', `/books/${bookId}`, { token: lib });
  check('stock decreased to 0', r.data.book.availableCopies === 0);
  r = await call('POST', '/issues', { token: lib, body: { bookId, studentEmail: stuEmail } });
  check('same student cannot take a second copy -> 409', r.status === 409);
  r = await call('POST', '/auth/register', { body: { name: 'Second Student', email: stu2Email, password: pass } });
  const student2Id = r.data.user?.id;
  r = await call('POST', '/issues', { token: lib, body: { bookId, studentEmail: stu2Email } });
  check('issue when no copies left -> 400', r.status === 400);
  r = await call('DELETE', `/books/${bookId}`, { token: lib });
  check('cannot delete a book that is issued -> 400', r.status === 400);
  r = await call('GET', '/issues/my', { token: stu });
  check('student dashboard shows the loan', r.status === 200 && r.data.current.length === 1 && r.data.totalDue === 0);
  r = await call('PUT', `/issues/${issueId}/return`, { token: lib });
  check('return book -> 200', r.status === 200);
  r = await call('PUT', `/issues/${issueId}/return`, { token: lib });
  check('return twice -> 400', r.status === 400);
  r = await call('GET', `/books/${bookId}`, { token: lib });
  check('stock back to 1', r.data.book.availableCopies === 1);

  // ---- reports (aggregation)
  r = await call('GET', '/reports/most-borrowed', { token: lib });
  check('aggregation: most borrowed', r.status === 200 && r.data.data.length > 0);
  r = await call('GET', '/reports/overdue', { token: lib });
  check('aggregation: overdue list', r.status === 200 && Array.isArray(r.data.data));
  r = await call('GET', '/reports/summary', { token: lib });
  check('summary', r.status === 200 && r.data.titles > 0);
  r = await call('GET', '/users?role=student', { token: lib });
  check('librarian can list students', r.status === 200 && r.data.users.every((u) => u.role === 'student'));

  // ---- clean up
  r = await call('DELETE', `/books/${bookId}`, { token: lib });
  check('delete book -> 200', r.status === 200);
  for (const id of [libId, studentId, student2Id, sneakyId]) await call('DELETE', `/users/${id}`, { token: adm });
  r = await call('POST', '/auth/login', { body: { email: libEmail, password: pass } });
  check('deleted librarian cannot log in -> 401', r.status === 401);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('Smoke test crashed:', e.message); process.exit(1); });
