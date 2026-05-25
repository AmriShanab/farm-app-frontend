import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);
let idCounter = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, { type = 'info', duration = 4000 } = {}) => {
    const id = idCounter++;
    setToasts((t) => [{ id, message, type }, ...t]);
    setTimeout(() => {
      setToasts((t) => t.filter(x => x.id !== id));
    }, duration);
    return id;
  }, []);

  const remove = useCallback((id) => setToasts((t) => t.filter(x => x.id !== id)), []);

  return (
    <ToastContext.Provider value={{ show, remove }}>
      {children}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ minWidth: 240, padding: '10px 14px', borderRadius: 10, color: '#fff', boxShadow: '0 6px 20px rgba(0,0,0,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: t.type === 'success' ? 'linear-gradient(90deg,#059669,#10b981)' : t.type === 'error' ? 'linear-gradient(90deg,#dc2626,#ef4444)' : t.type === 'warn' ? 'linear-gradient(90deg,#f59e0b,#f97316)' : 'linear-gradient(90deg,#374151,#4b5563)'}}>
            <div style={{ fontWeight: 400 }}>{t.type.toUpperCase()}</div>
            <div style={{ flex: 1, marginLeft: 8, fontSize: 10 }}>{t.message}</div>
            <button onClick={() => remove(t.id)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.9)', cursor: 'pointer', fontWeight: 800 }}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  const { show } = ctx;
  return {
    success: (msg, opts) => show(msg, { type: 'success', ...(opts || {}) }),
    error: (msg, opts) => show(msg, { type: 'error', ...(opts || {}) }),
    warn: (msg, opts) => show(msg, { type: 'warn', ...(opts || {}) }),
    info: (msg, opts) => show(msg, { type: 'info', ...(opts || {}) }),
  };
}
