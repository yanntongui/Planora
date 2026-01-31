
import React, { useMemo, useEffect, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import { Transaction } from '../../types';
import EditIcon from '../icons/EditIcon';
import TrashIcon from '../icons/TrashIcon';
import ConfirmationModal from '../ConfirmationModal';
import CheckIcon from '../icons/CheckIcon';
import XIcon from '../icons/XIcon';

// We need to re-create a simplified TransactionItem here because the main TransactionList manages its own state and data fetching.
const BudgetTransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const { t, locale, currency } = useLanguage();
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between py-2 px-2 rounded-lg"
    >
      <div>
        <p className="font-medium text-zinc-800 dark:text-zinc-100 capitalize">{transaction.label}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {new Date(transaction.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
        </p>
      </div>
      <p className="font-semibold text-zinc-800 dark:text-zinc-100">
        {formatter.format(transaction.amount)}
      </p>
    </motion.li>
  );
};


const BudgetDetailWidget: React.FC = () => {
    const { inspectedBudgetId, setInspectedBudgetId, budgets, transactions, updateBudget, deleteBudget, categories } = useFinance();
    const { t, locale, currency } = useLanguage();

    const budget = useMemo(() => budgets.find(b => b.id === inspectedBudgetId), [budgets, inspectedBudgetId]);

    const [isEditing, setIsEditing] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [formState, setFormState] = useState({ name: budget?.name || '', limit: budget?.limit.toString() || '' });

    useEffect(() => {
        if (!inspectedBudgetId) return;
        const budgetExists = budgets.some(b => b.id === inspectedBudgetId);
        if (!budgetExists) {
            setInspectedBudgetId(null);
        }
    }, [inspectedBudgetId, budgets, setInspectedBudgetId]);

    useEffect(() => {
        if (budget) {
            setFormState({ name: budget.name, limit: budget.limit.toString() });
        }
    }, [budget]);

    const budgetTransactions = useMemo(() => {
        if (!budget) return [];
        if (budget.type === 'event') {
            return transactions.filter(tx => tx.budgetId === budget.id && tx.type === 'expense');
        }
        // For monthly budgets, find all transactions in that category for the current month.
        if (budget.type === 'monthly') {
             const now = new Date();
             const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return transactions.filter(tx => 
                tx.category === budget.category && 
                tx.type === 'expense' &&
                new Date(tx.date) >= startOfMonth
            );
        }
        return [];
    }, [transactions, budget]);
    
    const budgetName = useMemo(() => {
        if(!budget) return '';
        if (budget.type === 'monthly' && budget.category) {
            const cat = categories.find(c => c.id === budget.category);
            return cat ? (cat.isCustom ? cat.name : t(cat.name)) : budget.name;
        }
        return budget.name;
    }, [budget, categories, t]);
    
    if (!budget) {
        return null;
    }

    const handleSave = () => {
        const newLimit = parseFloat(formState.limit);
        if (!isNaN(newLimit) && newLimit >= 0 && formState.name.trim() !== '') {
            updateBudget(budget.id, {
                name: formState.name.trim(),
                limit: newLimit
            });
            setIsEditing(false);
        }
    };
    
    const handleCancel = () => {
        setFormState({ name: budget.name, limit: budget.limit.toString() });
        setIsEditing(false);
    }
    
    const handleDelete = () => {
        deleteBudget(budget.id);
    }

    const progress = Math.min((budget.currentSpent / budget.limit) * 100, 100);
    const remaining = budget.limit - budget.currentSpent;
    const isOverBudget = progress >= 100;
    const progressColor = isOverBudget ? 'bg-red-500' : 'bg-purple-500';
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });

    return (
        <>
        <ConfirmationModal 
            isOpen={isConfirmingDelete}
            onClose={() => setIsConfirmingDelete(false)}
            onConfirm={handleDelete}
            title={t('budgetDetail.deleteConfirmationTitle')}
            message={t('budgetDetail.deleteConfirmationMessage', { name: budget.name })}
            confirmText={t('budgetDetail.deleteButton')}
            cancelText={t('budgetDetail.cancelButton')}
        />
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
        >
            <div className="flex justify-between items-start mb-4">
                <button
                    onClick={() => setInspectedBudgetId(null)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    {t('budgetDetail.backButton')}
                </button>
                 <div className="flex items-center gap-2">
                    {isEditing ? (
                         <>
                            <button onClick={handleCancel} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full" aria-label={t('budgetDetail.cancelButton')}><XIcon className="w-5 h-5"/></button>
                            <button onClick={handleSave} className="p-1.5 text-green-500 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full" aria-label={t('budgetDetail.saveButton')}><CheckIcon className="w-5 h-5"/></button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setIsEditing(true)} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full" aria-label={t('budgetDetail.editButton')}><EditIcon className="w-4 h-4"/></button>
                            <button onClick={() => setIsConfirmingDelete(true)} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full" aria-label={t('budgetDetail.deleteButton')}><TrashIcon className="w-4 h-4"/></button>
                        </>
                    )}
                 </div>
            </div>

            {isEditing ? (
                 <div className="flex flex-col gap-2">
                    <input 
                        type="text"
                        value={formState.name}
                        onChange={e => setFormState(s => ({...s, name: e.target.value}))}
                        disabled={budget.type === 'monthly'}
                        className="text-xl font-bold bg-zinc-100 dark:bg-zinc-800 rounded-md px-2 py-1 -ml-2 w-full disabled:bg-transparent disabled:dark:bg-transparent disabled:cursor-not-allowed"
                    />
                     <input 
                        type="number"
                        value={formState.limit}
                        onChange={e => setFormState(s => ({...s, limit: e.target.value}))}
                        className="text-sm bg-zinc-100 dark:bg-zinc-800 rounded-md px-2 py-1 -ml-2 w-48"
                    />
                </div>
            ) : (
                <>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        {budgetName}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 mb-3">
                        <span className="font-bold text-zinc-800 dark:text-zinc-100">{formatter.format(budget.currentSpent)}</span> {t('budgetDetail.spentOf')} {formatter.format(budget.limit)}
                    </p>
                </>
            )}
            
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-4 mt-3">
                <div className={`${progressColor} h-4 rounded-full transition-all duration-500 ease-out`} style={{ width: `${progress}%` }}></div>
            </div>
             <p className="text-right text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
                {formatter.format(remaining > 0 ? remaining : 0)} {t('budgetDetail.remaining')}
            </p>
            
            <div className="mt-6">
                <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2">{t('budgetDetail.transactionsTitle')}</h4>
                {budgetTransactions.length > 0 ? (
                    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {budgetTransactions.map(tx => (
                            <BudgetTransactionItem key={tx.id} transaction={tx} />
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-sm text-zinc-400 dark:text-zinc-500 py-6">{t('budgetDetail.empty')}</p>
                )}
            </div>
        </motion.div>
        </>
    );
};

export default BudgetDetailWidget;
