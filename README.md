# CampusLibrary - Library Management System (MERN)

A library system where **librarians manage books**, **students borrow and return them**, and **admins manage users**.
Stack: Express, Mongoose (MongoDB), dotenv, bcryptjs, jsonwebtoken (backend); React, react-router-dom, Fetch API, Context API (frontend).

> `bcryptjs` is the pure-JavaScript version of the bcrypt algorithm (same hashing, same API, no native build step).

## Features
| Requirement | Where it is |
|---|---|
| Roles: admin (only from `.env`), librarian (created by admin), student (registers) | `User.role`, `utils/bootstrapAdmin.js`, `middleware/auth.js` (`authorize`) |
| Book CRUD + search (title, author, category) + sort + pagination | `controllers/bookController.js`, `pages/Books.jsx` |
| Issue and return with due date, stock updated automatically (atomic) | `controllers/issueController.js` |
| Late-fee calculation on return | `utils/fine.js` (late days x `FINE_PER_DAY`), fine can be marked paid |
| Student dashboard (issued books, dues) | `GET /api/issues/my`, `pages/MyBooks.jsx` |
| Librarian reports with aggregation (most-borrowed, overdue, summary) | `controllers/reportController.js`, `pages/Reports.jsx` |
| bcrypt hashing + JWT access and refresh tokens (rotation) | `models/User.js`, `utils/tokens.js`, `authController.js` |
| Protected route + RBAC routes | `protect`, `authorize('librarian','admin')` |
| Reusable middleware | `validate.js` (required fields), `rateLimit.js` (login), `cors.js` |
| Centralised error handler (400/401/403/404/409/429/500) | `middleware/errorHandler.js` |
| Indexes | see `docs/ER-diagram.md` |

## Folder structure
```
backend/   config/ models/ controllers/ routes/ middleware/ utils/ scripts/ app.js server.js seed.js
frontend/  src/ (api.js, context/AuthContext.jsx, components/, pages/)
postman/   CampusLibrary.postman_collection.json
docs/      ER-diagram.md, screenshots/
```

## Startup guide (do these in order)

### 0. Install
- **Node.js 18 or newer** (https://nodejs.org). Check with `node -v`.
- **Git** (for pushing to GitHub) and **Postman**.
- **A MongoDB database.** Easiest: free **MongoDB Atlas** (cloud), so nothing is installed on your laptop (see step 1).

### 1. MongoDB Atlas (free)
1. Sign up at https://www.mongodb.com/atlas and create a free **M0** cluster.
2. **Database Access** -> Add Database User -> choose a username and password (avoid `@ : /` in the password).
3. **Network Access** -> Add IP Address -> *Allow access from anywhere* (`0.0.0.0/0`).
4. **Clusters -> Connect -> Drivers** -> copy the connection string and add the database name before the `?`:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/campus_library?retryWrites=true&w=majority`

(Local MongoDB also works: `MONGO_URI=mongodb://127.0.0.1:27017/campus_library`, but MongoDB must be running.)

### 2. Backend
```bash
cd backend
npm install
copy .env.example .env      # Windows (use "cp" on Mac/Linux)
```
Open `backend/.env` and set `MONGO_URI` (from step 1) and two long random secrets for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. Then:
```bash
npm run seed                # creates the admin from .env and 12 sample books
npm run dev                 # http://localhost:5000
npm run smoke               # (new terminal) runs 40+ automatic API checks, all should say PASS
```

### 3. Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

### Accounts and roles
| Role | How the account is made | Can do |
|---|---|---|
| **Admin** | Only from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`. Created automatically when the server starts. | Everything: books, issue/return, reports, create librarians, change roles |
| **Librarian** | Created by the admin on the **Users** page | Books, issue/return, reports |
| **Student** | Registers on the **Register** page | Search books, see own loans and fines |

- There are no demo accounts. Only the admin from `.env` can log in as admin. Nobody else can be made admin (the API refuses it), and if another admin ever appears in the database, the server turns it into a librarian when it starts.
- If you change `ADMIN_EMAIL` or `ADMIN_PASSWORD` in `.env` and restart the server, the admin account is updated to match.
- The catalogue starts with 12 sample books. Reports are empty until books are issued.

### Environment variables (`backend/.env`)
`PORT`, `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_EXPIRES`, `REFRESH_EXPIRES`, `CLIENT_URL`, `LOAN_DAYS`, `FINE_PER_DAY`, `MAX_BOOKS_PER_STUDENT`, plus `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` for the one admin account. `.env` is in `.gitignore` and must never be committed.

### Common errors
| Error | Fix |
|---|---|
| `ECONNREFUSED 127.0.0.1:27017` | Local MongoDB is not running. Use an Atlas `MONGO_URI` instead. |
| `bad auth` / `Authentication failed` | Wrong Atlas username or password in `MONGO_URI`. |
| `Server selection timed out` / `ENOTFOUND` | Atlas Network Access does not allow your IP (use `0.0.0.0/0`), or no internet. |
| `Missing JWT_ACCESS_SECRET` | `.env` file is missing or the secrets are empty. |
| `ADMIN_EMAIL and ADMIN_PASSWORD must be set` | Add both to `backend/.env` (password at least 6 characters). |
| Cannot log in as admin | Use exactly `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `backend/.env`. After editing `.env`, restart the backend. |
| `Application Control policy has blocked this file` | A Windows security setting blocks native `.node` files. This project avoids them (bcryptjs, WASM rollup and esbuild in `frontend/package.json`). Delete `node_modules` and `package-lock.json`, then `npm install` again. |
| Frontend shows "Failed to fetch" | Backend is not running on port 5000. |

## API documentation
Base URL `http://localhost:5000/api`. Protected routes need `Authorization: Bearer <accessToken>`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | /auth/register | public | Register (always a student) |
| POST | /auth/login | public | Login, returns access + refresh token (rate limited) |
| POST | /auth/refresh | public | New token pair from refresh token (old one stops working) |
| POST | /auth/logout | logged in | Invalidate refresh token |
| GET | /auth/me | logged in | Current user |
| GET | /books | logged in | Search/filter/sort/paginate (`q, category, available, sort, order, page, limit`) |
| GET | /books/categories | logged in | List of categories |
| GET | /books/:id | logged in | One book |
| POST / PUT / DELETE | /books, /books/:id | librarian, admin | Manage catalogue |
| POST | /issues | librarian, admin | Issue book `{ bookId, studentEmail }` |
| PUT | /issues/:id/return | librarian, admin | Return book, calculates fine |
| PUT | /issues/:id/pay-fine | librarian, admin | Mark fine as paid |
| GET | /issues | librarian, admin | All records (`status, page, limit`) |
| GET | /issues/my | logged in | My issued books, history, dues |
| GET | /reports/summary | librarian, admin | Counts |
| GET | /reports/most-borrowed | librarian, admin | Aggregation: top borrowed books |
| GET | /reports/overdue | librarian, admin | Aggregation: overdue list with fine |
| GET / POST | /users | librarian+admin / admin | List users / create a librarian or student (never an admin) |
| PATCH / DELETE | /users/:id(/role) | admin | Change role (librarian or student only) / delete. The admin account cannot be changed or deleted. |

Import `postman/CampusLibrary.postman_collection.json` into Postman. First set the collection variables `adminEmail` and `adminPassword` to the values in `backend/.env`. Then run the folders top to bottom, one request at a time. Each Login request saves the token, and `bookId`, `issueId` and `librarianId` are saved automatically.

## Business rules
- Loan period 14 days, fine Rs 5 per late day, max 3 books per student (configurable in `.env`).
- A student cannot hold two copies of the same book. A book cannot be returned twice. A book with active issues cannot be deleted.
- Public registration only creates students. Librarians are created by the admin. The admin is the account in `.env`.

## Deployment (one service)
`cd frontend && npm install && npm run build`. When `frontend/dist` exists, Express serves the React app too, so a single backend deployment (Render/Railway) hosts everything. Build command: `cd frontend && npm install && npm run build && cd ../backend && npm install`. Start command: `cd backend && npm start`. Set the env variables on the host (`CLIENT_URL` = your deployed URL).

## Postman API testing (screenshots)
All endpoints were tested in Postman using `postman/CampusLibrary.postman_collection.json`. Each screenshot shows the request, status code and response body.

### Accounts and authentication
**1. Login as admin from .env (200)**
![Admin login](docs/screenshots/01-login-admin.png)

**2. Admin creates a librarian (201)**
![Create librarian](docs/screenshots/02-create-librarian.png)

**3. Admin cannot create another admin (400)**
![No second admin](docs/screenshots/03-no-second-admin-400.png)

**4. Student registers (201)**
![Register student](docs/screenshots/04-register-student.png)

**5. Login as librarian (200)**
![Librarian login](docs/screenshots/05-login-librarian.png)

**6. Get current user, protected route (200)**
![Me](docs/screenshots/06-me.png)

**7. Refresh token (200)**
![Refresh](docs/screenshots/07-refresh.png)

**8. Request without token (401)**
![No token](docs/screenshots/08-no-token-401.png)

### Books
**9. Create book as librarian (201)**
![Create book](docs/screenshots/09-create-book.png)

**10. List books with search, filter and pagination (200)**
![List books](docs/screenshots/10-list-books.png)

**11. Update book (200)**
![Update book](docs/screenshots/11-update-book.png)

**12. Student cannot create a book, RBAC (403)**
![RBAC 403](docs/screenshots/12-rbac-403.png)

**13. Delete book (200)**
![Delete book](docs/screenshots/13-delete-book.png)

### Issue and return
**14. Issue book (201)**
![Issue](docs/screenshots/14-issue-book.png)

**15. Student dashboard, my books and dues (200)**
![My books](docs/screenshots/15-my-books.png)

**16. Return book (200)**
![Return](docs/screenshots/16-return-book.png)

### Reports (aggregation)
**17. Summary (200)**
![Summary](docs/screenshots/17-report-summary.png)

**18. Most borrowed books (200)**
![Most borrowed](docs/screenshots/18-most-borrowed.png)

**19. Overdue list (200)**
![Overdue](docs/screenshots/19-overdue.png)

### Users (admin)
**20. List users (200)**
![Users](docs/screenshots/20-users.png)
