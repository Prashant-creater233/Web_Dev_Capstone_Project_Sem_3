import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, qs } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import BookCover from '../components/BookCover';

export default function Books() {
  const { user } = useAuth();
  const toast = useToast();
  const staff = ['librarian', 'admin'].includes(user.role);

  const [filters, setFilters] = useState({
    q: '',
    category: '',
    available: false,
    sort: 'title',
    order: 'asc'
  });

  const [page, setPage] = useState(1);
  const [data, setData] = useState({
    books: [],
    pages: 1,
    total: 0
  });

  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/books/categories')
      .then((d) => setCategories(d.categories))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);

    const t = setTimeout(() => {
      api(`/api/books${qs({ ...filters, page, limit: 12 })}`)
        .then((d) => {
          setData(d);
          setError('');
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(t);
  }, [filters, page]);

  const change = (patch) => {
    setFilters({ ...filters, ...patch });
    setPage(1);
  };

  const remove = async (book) => {
    if (!window.confirm(`Delete "${book.title}"?`)) return;

    try {
      await api(`/api/books/${book._id}`, {
        method: 'DELETE'
      });

      setData({
        ...data,
        books: data.books.filter((b) => b._id !== book._id),
        total: data.total - 1
      });

      toast.success('Book deleted');
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Catalogue"
        subtitle={`${data.total} ${data.total === 1 ? 'book' : 'books'} in the library`}
      >
        {staff && (
          <Link className="btn" to="/books/new">
            <Icon name="plus" />
            Add book
          </Link>
        )}
      </PageHeader>

      <div className="search">
        <Icon name="search" size={20} />
        <input
          placeholder="Search by title or author"
          value={filters.q}
          onChange={(e) => change({ q: e.target.value })}
          aria-label="Search books"
        />
      </div>

      <div className="toolbar">
        <div className="chips" role="group" aria-label="Category">
          <button
            className={`chip${filters.category === '' ? ' on' : ''}`}
            onClick={() => change({ category: '' })}
          >
            All
          </button>

          {categories.map((c) => (
            <button
              key={c}
              className={`chip${filters.category === c ? ' on' : ''}`}
              onClick={() => change({ category: c })}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="toolbar-right">
          <button
            className={`chip${filters.available ? ' on' : ''}`}
            aria-pressed={filters.available}
            onClick={() => change({ available: !filters.available })}
          >
            Available now
          </button>

          <select
            className="select-sm"
            aria-label="Sort"
            value={`${filters.sort}:${filters.order}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split(':');
              change({ sort, order });
            }}
          >
            <option value="title:asc">Title A to Z</option>
            <option value="title:desc">Title Z to A</option>
            <option value="author:asc">Author A to Z</option>
            <option value="createdAt:desc">Newest first</option>
          </select>
        </div>
      </div>

      {error && <p className="alert bad">{error}</p>}

      {loading && data.books.length === 0 && (
        <div className="shelf">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton">
              <div className="cover" />
              <div className="sk-line" />
              <div className="sk-line short" />
            </div>
          ))}
        </div>
      )}

      {!loading && data.books.length === 0 && !error && (
        <div className="empty">
          <Icon name="search" size={32} />
          <h2>No books match</h2>
          <p>Try a different word, or clear the category filter.</p>
          <button
            className="btn secondary"
            onClick={() => setFilters({
              q: '',
              category: '',
              available: false,
              sort: 'title',
              order: 'asc'
            })}
          >
            Clear filters
          </button>
        </div>
      )}

      <div className={`shelf${loading ? ' busy' : ''}`}>
        {data.books.map((b) => (
          <article className="book-card" key={b._id}>
            <BookCover
              title={b.title}
              author={b.author}
              category={b.category}
            />

            <div className="book-meta">
              <h3>{b.title}</h3>
              <p className="muted small">{b.author}</p>

              <span className={`pill ${b.availableCopies > 0 ? 'ok' : 'bad'}`}>
                {b.availableCopies > 0
                  ? `${b.availableCopies} of ${b.totalCopies} on shelf`
                  : 'All copies issued'}
              </span>
            </div>

            {staff && (
              <div className="book-actions">
                {b.availableCopies > 0 && (
                  <Link className="btn sm" to={`/issue?bookId=${b._id}`}>
                    Issue
                  </Link>
                )}

                <Link
                  className="icon-btn"
                  to={`/books/${b._id}/edit`}
                  aria-label={`Edit ${b.title}`}
                  title="Edit"
                >
                  <Icon name="edit" size={16} />
                </Link>

                <button
                  className="icon-btn danger"
                  onClick={() => remove(b)}
                  aria-label={`Delete ${b.title}`}
                  title="Delete"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {data.pages > 1 && (
        <div className="pager">
          <button
            className="btn secondary sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>

          <span>Page {page} of {data.pages}</span>

          <button
            className="btn secondary sm"
            disabled={page >= data.pages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}