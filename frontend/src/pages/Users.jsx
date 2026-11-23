
import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';

const blank = {
  name: '',
  email: '',
  password: '',
  role: 'librarian',
  rollNo: ''
};

// Admin only: create librarians/students, change roles, delete users
export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(blank);

  const load = () =>
    api('/api/users')
      .then((d) => setUsers(d.users))
      .catch((e) => toast.error(e.message));

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const create = async (e) => {
    e.preventDefault();

    try {
      await api('/api/users', {
        method: 'POST',
        body: form
      });

      setForm(blank);
      toast.success('User created');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const changeRole = async (id, role) => {
    try {
      await api(`/api/users/${id}/role`, {
        method: 'PATCH',
        body: { role }
      });

      toast.success('Role updated');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name}?`)) return;

    try {
      await api(`/api/users/${u.id}`, {
        method: 'DELETE'
      });

      toast.success('User deleted');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="You are the admin. Create librarian accounts here. Students register on their own."
      />

      <div className="two-col">
        <form className="panel sticky" onSubmit={create}>
          <h2>Add a librarian or student</h2>

          <label className="field">
            <span>Name</span>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              required
            />
          </label>

          <label className="field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              minLength={6}
              value={form.password}
              onChange={onChange}
              required
            />
          </label>

          <label className="field">
            <span>Role</span>
            <select
              name="role"
              value={form.role}
              onChange={onChange}
            >
              <option value="librarian">Librarian</option>
              <option value="student">Student</option>
            </select>
          </label>

          {form.role === 'student' && (
            <label className="field">
              <span>Roll number (optional)</span>
              <input
                name="rollNo"
                value={form.rollNo}
                onChange={onChange}
              />
            </label>
          )}

          <button className="btn block">
            <Icon name="plus" />
            Create user
          </button>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="who">
                      <Avatar name={u.name} />
                      <div>
                        {u.name}
                        {u.id === me.id && (
                          <span className="pill neutral gap-l">
                            You
                          </span>
                        )}
                        <br />
                        <small className="muted">
                          {u.email}
                          {u.rollNo ? `, roll ${u.rollNo}` : ''}
                        </small>
                      </div>
                    </div>
                  </td>

                  <td>
                    {u.role === 'admin' ? (
                      <span className="pill neutral">Admin</span>
                    ) : (
                      <select
                        className="select-sm"
                        aria-label={`Role of ${u.name}`}
                        value={u.role}
                        onChange={(e) =>
                          changeRole(u.id, e.target.value)
                        }
                      >
                        <option value="student">Student</option>
                        <option value="librarian">Librarian</option>
                      </select>
                    )}
                  </td>

                  <td className="right">
                    {u.role !== 'admin' && (
                      <button
                        className="icon-btn danger"
                        onClick={() => remove(u)}
                        aria-label={`Delete ${u.name}`}
                        title="Delete"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
