import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' }); // controlled form
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from?.pathname || '/books', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={onSubmit}>
        <h2 className="auth-title">Welcome back</h2>
        <p className="muted">Log in to browse books and manage your loans.</p>
        {error && <p className="alert bad">{error}</p>}
        <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} required /></label>
        <label className="field"><span>Password</span><input name="password" type="password" autoComplete="current-password" value={form.password} onChange={onChange} required /></label>
        <button className="btn block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>

        <p className="muted small">New student? <Link to="/register">Create an account</Link></p>
      </form>
    </AuthLayout>
  );
}
