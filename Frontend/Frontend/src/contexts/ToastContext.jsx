import React, { createContext, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { randomUUID } from '../utils/uuid.js';
const Context = createContext(null);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const remove = (id) => setItems((v) => v.filter((t) => t.id !== id));
  function toast(message, type = 'success') {
    const id = randomUUID();
    setItems((v) => [...v, { id, message, type }]);
    setTimeout(() => remove(id), 5000);
  }
  return (
    <Context.Provider value={toast}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={'toast ' + t.type}>
            {t.type === 'success' ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{t.message}</span>
            <button aria-label="Đóng thông báo" onClick={() => remove(t.id)}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </Context.Provider>
  );
}
export const useToast = () => useContext(Context);
