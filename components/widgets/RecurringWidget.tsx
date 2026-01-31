
import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { RecurringTransaction, Frequency } from '../../types';
import XIcon from '../icons/XIcon';
import RefreshCwIcon from '../icons/RefreshCwIcon';
import EditIcon from '../icons/EditIcon';
import CheckIcon from '../icons/CheckIcon';

const RecurringTransactionItem: React.FC<{ item: RecurringTransaction }> = ({ item }) => {
    const { deleteRecurringTransaction, updateRecurringTransaction } = useFinance();
    const { t, locale, currency } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    
    const [formState, setFormState] = useState({
        label: item.label,
        amount: item.amount.toString(),
        frequency: item.frequency,
        nextDueDate: item.nextDueDate.split('T')[0]
    });

    const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
    });

    const dateFormatter = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
    
    const amountColor = item.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-zinc-800 dark:text-zinc-100';

    const handleSave = () => {
        const amount = parseFloat(formState.amount);
        if (formState.label.trim() && !isNaN(amount) && amount > 0) {
            updateRecurringTransaction(item.id, {
                label: formState.label,
                amount,
                frequency: formState.frequency,
                nextDueDate: new Date(formState.nextDueDate).toISOString()
            });
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <li className="flex flex-col gap-2 py-3 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-purple-500">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={formState.label}
                        onChange={e => setFormState(s => ({...s, label: e.target.value}))}
                        className="flex-grow bg-zinc-200 dark:bg-zinc-700 rounded px-2 py-1 text-sm font-medium text-zinc-900 dark:text-zinc-100"
                    />
                    <input 
                        type="number" 
                        value={formState.amount}
                        onChange={e => setFormState(s => ({...s, amount: e.target.value}))}
                        className="w-24 bg-zinc-200 dark:bg-zinc-700 rounded px-2 py-1 text-sm font-semibold text-right text-zinc-900 dark:text-zinc-100"
                    />
                </div>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-grow">
                        <select
                            value={formState.frequency}
                            onChange={e => setFormState(s => ({...s, frequency: e.target.value as Frequency}))}
                            className="bg-zinc-200 dark:bg-zinc-700 rounded px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200"
                        >
                            <option value="weekly">{t('recurring.weekly')}</option>
                            <option value="monthly">{t('recurring.monthly')}</option>
                            <option value="yearly">{t('recurring.yearly')}</option>
                        </select>
                        <input
                            type="date"
                            value={formState.nextDueDate}
                            onChange={e => setFormState(s => ({...s, nextDueDate: e.target.value}))}
                            className="bg-zinc-200 dark:bg-zinc-700 rounded px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200"
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setIsEditing(false)} className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"><XIcon className="w-4 h-4" /></button>
                        <button onClick={handleSave} className="p-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"><CheckIcon className="w-5 h-5" /></button>
                    </div>
                </div>
            </li>
        );
    }

    return (
        <li className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-900/50 group">
            <div className="flex-grow">
                <p className="font-medium text-zinc-800 dark:text-zinc-100 capitalize">{item.label}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t(`recurring.nextPayment`)}: {dateFormatter.format(new Date(item.nextDueDate))}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <div className="text-right">
                    <p className={`font-semibold text-sm ${amountColor}`}>
                    {formatter.format(item.amount)}
                    </p>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">{t(`recurring.${item.frequency}`)}</span>
                </div>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        aria-label={t('history.editAriaLabel')}
                    >
                        <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => deleteRecurringTransaction(item.id)}
                        className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        aria-label={t('recurring.deleteAriaLabel')}
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </li>
    );
};


const RecurringWidget: React.FC = () => {
    const { recurringTransactions } = useFinance();
    const { t } = useLanguage();

    return (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <RefreshCwIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                {t('recurring.title')}
            </h3>
            {recurringTransactions.length > 0 ? (
                <ul className="space-y-2">
                    {recurringTransactions.map(item => (
                        <RecurringTransactionItem key={item.id} item={item} />
                    ))}
                </ul>
            ) : (
                <p className="text-zinc-500 dark:text-zinc-500 text-sm">{t('recurring.empty')}</p>
            )}
        </div>
    );
};

export default RecurringWidget;