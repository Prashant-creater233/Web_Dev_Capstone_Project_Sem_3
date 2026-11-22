const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('./middleware/cors');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors);
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/books', require('./routes/bookRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// If the React app was built (frontend/dist), Express serves it too -> one server, one URL
const dist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(notFound);
app.use(errorHandler); // must be the LAST middleware

module.exports = app;
