import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, fmtDate, qs } from '../api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';

// Librarian screen: issue a book to a student, and return books
export default function IssueReturn() {
  const toast = useToast();
  const [searchParams] = useSearchParams(); // /issue?bookId=... comes from the Issue button on the Books page
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ studentEmail: '', bookId: searchParams.get('bookId') || '' });
  const [status, setStatus] = useState('issued');
  const [page, setPage] = useState(1);
  const [list, setList] = useState({ records: [], pages: 1 });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    api('/api/books?limit=100&available=true&sort=title').then((d) => setBooks(d.books)).catch(() => {});
  }, [reload]);

  useEffect(() => {
    api('/users?role=student').then((d) => setStudents(d.users)).catch(() => {});
  }, [reload]);

  useEffect(() => {
    api(`/issues${qs({ status, page, limit: 8 })}`).then(setList).catch((e) => toast.error(e.message));
  }, [status, page, reload]); // eslint-disable-line react-hooks/exhaustive-deps

  const issue = async (e) => {
    e.preventDefault();
    try {
      await api('/issues', { method: 'POST', body: form });
      toast.success('Book issued');
      setForm({ ...form, bookId: '' });
      setReload((n) => n + 1);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const act = async (id, action) => {
    try {
      const d = await api(`/issues/${id}/${action}`, { method: 'PUT' });
      toast.success(d.message || 'Done');
      setReload((n) => n + 1);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const tabs = [['issued', 'Borrowed now'], ['returned', 'Returned'], ['', 'All']];

  return (
    <>
      <PageHeader title="Issue and return" subtitle="Lend a book to a student, or take one back." />

      <div className="two-col">
        <form className="panel sticky" onSubmit={issue}>
          <h2>Issue a book</h2>
          <label className="field"><span>Student email</span><input type="email" list="student-list" value={form.studentEmail} onChange={(e) => setForm({ ...form, studentEmail: e.target.value })} placeholder="Start typing the student's email" required />
            <datalist id="student-list">{students.map((s) => <option key={s.id} value={s.email}>{s.name}</option>)}</datalist>
          </label>
          <label className="field"><span>Book</span>
            <select value={form.bookId} onChange={(e) => setForm({ ...form, bookId: e.target.value })} required>
              <option value="">Choose a book</option>
              {books.map((b) => <option key={b._id} value={b._id}>{b.title} ({b.availableCopies} left)</option>)}
            </select>
          </label>
          <button className="btn block"><Icon name="swap" />Issue book</button>
          <p className="muted small">Loans are 14 days. Late returns add a fine for every extra day.</p>
        </form>

        <div>
          <div className="row between wrap">
            <h2>Records</h2>
            <div className="tabs" role="tablist">
              {tabs.map(([value, label]) => (
                <button key={label} role="tab" aria-selected={status === value} className={status === value ? 'on' : ''} onClick={() => { setStatus(value); setPage(1); }}>{label}</button>
              ))}
            </div>
          </div>

          <div className="table-wrap"><table>
            <thead><tr><th>Student</th><th>Book</th><th>Due</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.records.map((r) => (
                <tr key={r._id}>
                  <td><div className="who"><Avatar name={r.student?.name} size={30} /><div>{r.student?.name}<br /><small className="muted">{r.student?.email}</small></div></div></td>
                  <td>{r.book?.title}</td>
                  <td className="nowrap">{fmtDate(r.dueDate)}</td>
                  <td>
                    {r.status === 'issued'
                      ? (r.daysLate > 0 ? <span className="pill bad">{r.daysLate} days late, Rs {r.currentFine}</span> : <span className="pill ok">On loan</span>)
                      : <span className="pill neutral">Returned {fmtDate(r.returnDate)}</span>}
                    {r.status === 'returned' && r.fine > 0 && <span className={`pill ${r.finePaid ? 'ok' : 'bad'} gap-l`}>Fine Rs {r.fine} {r.finePaid ? 'paid' : 'unpaid'}</span>}
                  </td>
                  <td className="right">
                    {r.status === 'issued' && <button className="btn sm" onClick={() => act(r._id, 'return')}>Return</button>}
                    {r.status === 'returned' && r.fine > 0 && !r.finePaid && <button className="btn sm secondary" onClick={() => act(r._id, 'pay-fine')}>Mark fine paid</button>}
                  </td>
                </tr>
              ))}
              {list.records.length === 0 && <tr><td colSpan="5" className="muted center">No records here yet.</td></tr>}
            </tbody>
          </table></div>

          {list.pages > 1 && (
            <div className="pager">
              <button className="btn secondary sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span>Page {page} of {list.pages}</span>
              <button className="btn secondary sm" disabled={page >= list.pages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
