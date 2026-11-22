import Icon from './Icon';

// [height %, colour, width px] - a shelf of book spines
const SPINES = [
  [78, '#7A2E3A', 22], [92, '#24503F', 30], [64, '#2E3A7A', 18], [100, '#8A5A12', 26], [70, '#3E5566', 20], [88, '#5E3A6E', 28],
  [58, '#1F6F78', 16], [96, '#6B4A2B', 24], [74, '#8B3A62', 20], [84, '#3C4F2A', 26], [66, '#2E3A7A', 18], [90, '#7A2E3A', 24],
];

const SHELF = [...SPINES, ...SPINES.slice(3), ...SPINES.slice(0, 6)];

export default function AuthLayout({ children }) {
  return (
    <div className="auth">
      <section className="auth-art">
        <div className="auth-copy">
          <span className="logo"><Icon name="book" size={22} /><span>CampusLibrary</span></span>
          <h1>Every book on campus, one search away.</h1>
          <p>Browse the catalogue, see what is on the shelf right now, and keep track of what you have borrowed.</p>
        </div>
        <div className="shelf-art" aria-hidden="true">
          {SHELF.map(([h, c, w], i) => (
            <span key={i} className={`spine${i === 5 ? ' lean' : ''}`} style={{ height: `${h}%`, width: w, background: c, '--i': i }} />
          ))}
        </div>
      </section>
      <section className="auth-form">
        <div className="auth-card">{children}</div>
      </section>
    </div>
  );
}
