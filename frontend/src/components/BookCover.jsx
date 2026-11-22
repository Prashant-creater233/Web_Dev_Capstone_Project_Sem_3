// A generated book cover. The colour comes from the title, so a book always has the same colour everywhere.
const COVERS = ['#7A2E3A', '#24503F', '#2E3A7A', '#8A5A12', '#3E5566', '#5E3A6E', '#1F6F78', '#6B4A2B', '#3C4F2A', '#8B3A62'];

export const coverColor = (key = '') => {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COVERS[h % COVERS.length];
};

export default function BookCover({ title, author, size = 'md' }) {
  return (
    <div className={`cover ${size}`} style={{ '--cover': coverColor(title) }} aria-hidden="true">
      <span className="cover-title">{title || 'Untitled'}</span>
      <span className="cover-author">{author}</span>
    </div>
  );
}
