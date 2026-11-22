import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', rollNo: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      navigate('/books');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={onSubmit}>
        <h2 className="auth-title">Create your account</h2>
        <p className="muted">Student accounts can search the catalogue and see their own loans.</p>
        {error && <p className="alert bad">{error}</p>}
        <label className="field"><span>Full name</span><input name="name" autoComplete="name" value={form.name} onChange={onChange} required /></label>
        <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} required /></label>
        <label className="field"><span>Roll number</span><input name="rollNo" value={form.rollNo} onChange={onChange} /></label>
        <label className="field"><span>Password (at least 6 characters)</span><input name="password" type="password" minLength={6} autoComplete="new-password" value={form.password} onChange={onChange} required /></label>
        <button className="btn block" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="muted small">Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </AuthLayout>
  );
}
