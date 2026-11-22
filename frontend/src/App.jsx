import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Icon from './components/Icon';
import Login from './pages/Login';
import Register from './pages/Register';
import Books from './pages/Books';
import BookForm from './pages/BookForm';
import MyBooks from './pages/MyBooks';
import IssueReturn from './pages/IssueReturn';
import Reports from './pages/Reports';
import Users from './pages/Users';

const STAFF = ['librarian', 'admin'];

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="splash"><Icon name="book" size={30} /></div>;

  return (
    <div className={user ? 'shell' : 'public'}>
      {user && <Sidebar />}
      <main className={user ? 'content' : 'public-main'}>
        <Routes>
          <Route path="/" element={<Navigate to="/books" replace />} />
          <Route path="/login" element={user ? <Navigate to="/books" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/books" replace /> : <Register />} />

          <Route path="/books" element={<ProtectedRoute><Books /></ProtectedRoute>} />
          <Route path="/my-books" element={<ProtectedRoute roles={['student']}><MyBooks /></ProtectedRoute>} />

          <Route path="/books/new" element={<ProtectedRoute roles={STAFF}><BookForm /></ProtectedRoute>} />
          <Route path="/books/:id/edit" element={<ProtectedRoute roles={STAFF}><BookForm /></ProtectedRoute>} />
          <Route path="/issue" element={<ProtectedRoute roles={STAFF}><IssueReturn /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute roles={STAFF}><Reports /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />

          <Route path="*" element={<div className="empty"><h2>Page not found</h2><p>Check the address, or use the menu.</p></div>} />
        </Routes>
      </main>
    </div>
  );
}
