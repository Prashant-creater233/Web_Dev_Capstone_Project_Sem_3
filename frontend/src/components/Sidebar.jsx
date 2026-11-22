import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';
import Avatar from './Avatar';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const staff = ['librarian', 'admin'].includes(user.role);

  const items = [
    { to: '/books', label: 'Books', icon: 'library', show: true },
    { to: '/my-books', label: 'My books', icon: 'bookmark', show: user.role === 'student' },
    { to: '/issue', label: 'Issue and return', icon: 'swap', show: staff },
    { to: '/reports', label: 'Reports', icon: 'chart', show: staff },
    { to: '/users', label: 'Users', icon: 'users', show: user.role === 'admin' },
  ].filter((i) => i.show);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <NavLink to="/" className="logo"><Icon name="book" size={22} /><span>CampusLibrary</span></NavLink>
      <nav aria-label="Main">
        {items.map((i) => (
          <NavLink key={i.to} to={i.to}><Icon name={i.icon} /><span>{i.label}</span></NavLink>
        ))}
      </nav>
      <div className="me">
        <Avatar name={user.name} />
        <div className="me-text"><b>{user.name}</b><small>{user.role}</small></div>
        <button className="icon-btn on-dark" onClick={handleLogout} aria-label="Log out" title="Log out"><Icon name="logout" /></button>
      </div>
    </aside>
  );
}
