
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastContextType, ToastAction } from '../types';
import Toast from '../components/Toast';

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<ToastAction | undefined>(undefined);

  const showToast = useCallback((message: string, action?: ToastAction) => {
    setToastMessage(message);
    setToastAction(action);
    setTimeout(() => {
      setToastMessage(null);
      setToastAction(undefined);
    }, 4000); // Increased duration slightly to allow clicking action
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast message={toastMessage} action={toastAction} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};