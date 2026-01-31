
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CheckCircleIcon from './icons/CheckCircleIcon';
import { ToastAction } from '../types';

interface ToastProps {
  message: string | null;
  action?: ToastAction;
}

const Toast: React.FC<ToastProps> = ({ message, action }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full shadow-lg z-50 whitespace-nowrap"
        >
          <CheckCircleIcon className="w-5 h-5 text-green-400 dark:text-green-600" />
          <p className="text-sm font-medium">{message}</p>
          {action && (
              <button 
                onClick={action.onClick}
                className="ml-2 px-3 py-1 bg-zinc-700 dark:bg-zinc-200 hover:bg-zinc-600 dark:hover:bg-zinc-300 rounded-full text-xs font-bold transition-colors"
              >
                  {action.label}
              </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;