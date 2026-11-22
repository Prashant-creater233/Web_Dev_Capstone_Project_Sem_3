import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import BookCover from '../components/BookCover';

const empty = {
  title: '',
  author: '',
  category: '',
  isbn: '',
  totalCopies: 1,
  description: ''
};

export default function BookForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (id) {
      api(`/api/books/${id}`)
        .then((d) => setForm({ ...empty, ...d.book }))
        .catch((e) => setError(e.message));
    }
  }, [id]);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    const body = {
      title: form.title,
      author: form.author,
      category: form.category,
      isbn: form.isbn,
      description: form.description,
      totalCopies: Number(form.totalCopies)
    };

    try {
      await api(
        id ? `/api/books/${id}` : '/api/books',
        {
          method: id ? 'PUT' : 'POST',
          body
        }
      );

      toast.success(id ? 'Changes saved' : 'Book added');
      navigate('/books');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title={id ? 'Edit book' : 'Add a book'}
        subtitle="Fill in the details. The cover on the right shows how it will look in the catalogue."
      />

      <form className="panel form-split" onSubmit={onSubmit}>
        <div>
          {error && <p className="alert bad">{error}</p>}

          <div className="grid-2">
            <label className="field">
              <span>Title</span>
              <input
                name="title"
                value={form.title}
                onChange={onChange}
                required
              />
            </label>

            <label className="field">
              <span>Author</span>
              <input
                name="author"
                value={form.author}
                onChange={onChange}
                required
              />
            </label>

            <label className="field">
              <span>Category</span>
              <input
                name="category"
                value={form.category}
                onChange={onChange}
                placeholder="For example: Computer Science"
                required
              />
            </label>

            <label className="field">
              <span>ISBN</span>
              <input
                name="isbn"
                value={form.isbn}
                onChange={onChange}
                required
              />
            </label>

            <label className="field">
              <span>Total copies</span>
              <input
                name="totalCopies"
                type="number"
                min="1"
                value={form.totalCopies}
                onChange={onChange}
                required
              />
            </label>
          </div>

          <label className="field">
            <span>Description (optional)</span>
            <textarea
              name="description"
              rows="3"
              value={form.description || ''}
              onChange={onChange}
            />
          </label>

          <div className="row gap">
            <button className="btn" disabled={busy}>
              {id ? 'Save changes' : 'Add book'}
            </button>

            <button
              type="button"
              className="btn secondary"
              onClick={() => navigate('/books')}
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="preview">
          <BookCover
            title={form.title}
            author={form.author}
            category={form.category}
          />
        </div>
      </form>
    </>
  );
}