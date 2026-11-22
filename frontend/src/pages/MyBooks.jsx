import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtDate } from '../api';
import PageHeader from '../components/PageHeader';
import BookCover from '../components/BookCover';
import Icon from '../components/Icon';

const DAY = 86400000;

// days left and how much of the loan period has passed (for the progress bar)
const loanInfo = (r) => {
  const now = Date.now();
  const due = new Date(r.dueDate).getTime();
  const start = new Date(r.issueDate).getTime();
  return { left: Math.ceil((due - now) / DAY), used: Math.min(1, Math.max(0, (now - start) / (due - start))) };
};

// Student dashboard: issued books, due dates, fines
export default function MyBooks() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/issues/my').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="alert bad">{error}</p>;
  if (!data) return <p className="muted">Loading your books…</p>;

  return (
    <>
      <PageHeader title="My books" subtitle="What you have borrowed, when it is due, and any fine." />

      <div className="strip">
        <div><b>{data.current.length} of {data.limits.maxBooks}</b><span>books borrowed</span></div>
        <div className={data.totalDue > 0 ? 'warn' : ''}><b>Rs {data.totalDue}</b><span>fine to pay</span></div>
        <div><b>{data.limits.loanDays} days</b><span>loan period, Rs {data.limits.finePerDay} per late day</span></div>
      </div>

      <h2 className="section">Borrowed now</h2>
      {data.current.length === 0 ? (
        <div className="empty small-empty">
          <p>You have no books right now.</p>
          <Link className="btn secondary" to="/books">Browse the catalogue</Link>
        </div>
      ) : (
        <div className="panel list">
          {data.current.map((r) => {
            const { left, used } = loanInfo(r);
            const late = r.daysLate > 0;
            const tone = late ? 'bad' : left <= 3 ? 'warn' : 'ok';
            return (
              <div className="loan" key={r._id}>
                <BookCover title={r.book?.title} category={r.book?.category} size="sm" />
                <div className="loan-main">
                  <h3>{r.book?.title}</h3>
                  <p className="muted small">{r.book?.author}</p>
                  <div className={`meter ${tone}`} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(used * 100)} aria-label="Loan period used"><i style={{ width: `${used * 100}%` }} /></div>
                  <p className="small muted">Borrowed {fmtDate(r.issueDate)}. Due {fmtDate(r.dueDate)}.</p>
                </div>
                <div className="loan-status">
                  {late ? (
                    <span className="pill bad"><Icon name="alert" size={14} />{r.daysLate} {r.daysLate === 1 ? 'day' : 'days'} late, fine Rs {r.currentFine}</span>
                  ) : (
                    <span className={`pill ${tone}`}><Icon name="clock" size={14} />{left <= 0 ? 'Due today' : `Due in ${left} ${left === 1 ? 'day' : 'days'}`}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="section">History</h2>
      {data.history.length === 0 ? <p className="muted">No returned books yet.</p> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Book</th><th>Borrowed</th><th>Returned</th><th>Fine</th></tr></thead>
          <tbody>
            {data.history.map((r) => (
              <tr key={r._id}>
                <td>{r.book?.title}<br /><small className="muted">{r.book?.author}</small></td>
                <td>{fmtDate(r.issueDate)}</td>
                <td>{fmtDate(r.returnDate)}</td>
                <td>{r.fine > 0 ? <span className={`pill ${r.finePaid ? 'ok' : 'bad'}`}>Rs {r.fine} {r.finePaid ? 'paid' : 'unpaid'}</span> : <span className="muted">None</span>}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </>
  );
}