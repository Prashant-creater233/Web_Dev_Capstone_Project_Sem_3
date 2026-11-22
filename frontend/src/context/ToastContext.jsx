import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Icon from '../components/Icon';

// Small pop-up messages: toast.success('Saved') / toast.error('Something failed')
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((type, text) => {
    const id = Date.now() + Math.random();
    setItems((list) => [...list, { id, type, text }]);
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 3800);
  }, []);

  const api = useMemo(() => ({ success: (t) => push('success', t), error: (t) => push('error', t) }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <Icon name={t.type === 'error' ? 'alert' : 'check'} size={16} />
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
