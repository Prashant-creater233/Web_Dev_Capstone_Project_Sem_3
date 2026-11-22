import { useEffect, useState } from 'react';
import { api, fmtDate } from '../api';
import PageHeader from '../components/PageHeader';
import Icon from '../components/Icon';
import { coverColor } from '../components/BookCover';

// Reports built from MongoDB aggregation pipelines
export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [popular, setPopular] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/reports/summary'), api('/reports/most-borrowed?limit=5'), api('/reports/overdue')])
      .then(([s, p, o]) => { setSummary(s); setPopular(p.data); setOverdue(o.data); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="alert bad">{error}</p>;
  if (!summary) return <p className="muted">Loading reports…</p>;

  const max = Math.max(1, ...popular.map((p) => p.timesBorrowed));
  const onShelf = summary.totalCopies ? Math.round((summary.availableCopies / summary.totalCopies) * 100) : 0;

  return (
    <>
      <PageHeader title="Reports" subtitle="A live view of the shelves, loans and fines." />

      <div className="strip">
        <div><b>{summary.titles}</b><span>titles</span></div>
        <div><b>{summary.issuedNow}</b><span>copies on loan</span></div>
        <div className={summary.overdueNow > 0 ? 'warn' : ''}><b>{summary.overdueNow}</b><span>overdue</span></div>
        <div><b>{summary.students}</b><span>students</span></div>
        <div><b>Rs {summary.finesCollected}</b><span>fines collected</span></div>
      </div>

      <div className="two-col even">
        <section className="panel">
          <h2>Shelf status</h2>
          <div className="donut-wrap">
            <div className="donut" style={{ '--p': onShelf }} role="img" aria-label={`${onShelf} percent of copies are on the shelf`}>
              <div><b>{onShelf}%</b><span>on shelf</span></div>
            </div>
            <ul className="legend">
              <li><i className="dot on" />{summary.availableCopies} copies on the shelf</li>
              <li><i className="dot off" />{summary.totalCopies - summary.availableCopies} copies on loan</li>
              <li className="muted small">{summary.totalCopies} copies in total</li>
            </ul>
          </div>
        </section>

        <section className="panel">
          <h2>Most borrowed books</h2>
          {popular.length === 0 ? <p className="muted">Nothing has been borrowed yet.</p> : (
            <div className="bars">
              {popular.map((p) => (
                <div className="bar-row" key={p.bookId}>
                  <span className="bar-label" title={p.title}>{p.title}</span>
                  <span className="bar-track"><span className="bar" style={{ width: `${(p.timesBorrowed / max) * 100}%`, background: coverColor(p.title) }} /></span>
                  <span className="bar-count">{p.timesBorrowed}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <h2 className="section">Overdue books</h2>
      {overdue.length === 0 ? (
        <div className="empty small-empty"><Icon name="check" size={28} /><p>No overdue books right now.</p></div>
      ) : (
        <div className="table-wrap"><table>
          <thead><tr><th>Book</th><th>Student</th><th>Due</th><th>Days late</th><th>Fine so far</th></tr></thead>
          <tbody>
            {overdue.map((o) => (
              <tr key={o._id}>
                <td>{o.title}</td>
                <td>{o.studentName}<br /><small className="muted">{o.studentEmail}</small></td>
                <td>{fmtDate(o.dueDate)}</td>
                <td><span className="pill bad">{o.daysLate} days</span></td>
                <td><b>Rs {o.fine}</b></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </>
  );
}
