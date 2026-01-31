
import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { CoachAlert } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, SparklesIcon, AlertCircleIcon, CheckCircleIcon } from './icons';

const AlertIcon: React.FC<{ type: CoachAlert['type'] }> = ({ type }) => {
    switch (type) {
        case 'warning': return <AlertCircleIcon className="w-5 h-5 text-orange-500" />;
        case 'success': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
        case 'info':
        default: return <SparklesIcon className="w-5 h-5 text-blue-500" />;
    }
};

const CoachAlertItem: React.FC<{ alert: CoachAlert }> = ({ alert }) => {
    const { dismissCoachAlert } = useFinance();

    const bgColor = {
        warning: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
        success: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
        info: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
    }[alert.type];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            role="alert"
            aria-live="polite"
            className={`flex gap-3 p-4 rounded-xl border ${bgColor} relative group shadow-sm mb-3`}
        >
            <div className="flex-shrink-0 mt-0.5">
                <AlertIcon type={alert.type} />
            </div>
            <div className="flex-grow min-w-0 pr-6">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{alert.title}</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">{alert.message}</p>
                {alert.actionLabel && (
                    <button className="mt-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">
                        {alert.actionLabel}
                    </button>
                )}
            </div>
            <button
                onClick={() => dismissCoachAlert(alert.id)}
                aria-label={alert.type === 'warning' ? 'Fermer l\'alerte de sécurité' : 'Fermer l\'alerte'}
                className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <XIcon className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

const CoachAlerts: React.FC = () => {
    const { coachAlerts } = useFinance();

    if (coachAlerts.length === 0) return null;

    return (
        <div className="space-y-3">
            <AnimatePresence>
                {coachAlerts.map(alert => (
                    <CoachAlertItem key={alert.id} alert={alert} />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default CoachAlerts;
