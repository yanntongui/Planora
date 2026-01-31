
import React, { useMemo, useEffect, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import { Transaction } from '../../types';
import EditIcon from '../icons/EditIcon';
import TrashIcon from '../icons/TrashIcon';
import ConfirmationModal from '../ConfirmationModal';
import CheckIcon from '../icons/CheckIcon';
import XIcon from '../icons/XIcon';
import TargetIcon from '../icons/TargetIcon';
import MinusIcon from '../icons/MinusIcon';
import PlusIcon from '../icons/PlusIcon';
import SparklesIcon from '../icons/SparklesIcon';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const GoalContributionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const { t, locale, currency } = useLanguage();
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
  const isWithdrawal = transaction.type === 'income';

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
      <p className={`font-semibold ${isWithdrawal ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
        {isWithdrawal ? '-' : '+'} {formatter.format(transaction.amount)}
      </p>
    </motion.li>
  );
};

const CustomTooltip: React.FC<any> = ({ active, payload, label, currency, locale }) => {
  if (active && payload && payload.length) {
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 });
    return (
      <div className="bg-white dark:bg-zinc-800 p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl text-sm">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            <span className="capitalize">{entry.name}:</span>
            <span className="font-bold font-mono ml-auto">{formatter.format(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const GoalDetailWidget: React.FC = () => {
    const { inspectedGoalId, setInspectedGoalId, goals, transactions, updateGoal, deleteGoal, withdrawFromGoal, addContributionToGoal } = useFinance();
    const { t, locale, currency } = useLanguage();
    const { theme } = useTheme();

    const goal = useMemo(() => goals.find(g => g.id === inspectedGoalId), [goals, inspectedGoalId]);

    const [isEditing, setIsEditing] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    
    const [formState, setFormState] = useState({ 
        name: goal?.name || '', 
        target: goal?.target.toString() || '',
        targetDate: goal?.targetDate ? goal.targetDate.split('T')[0] : ''
    });

    useEffect(() => {
        if (!inspectedGoalId) return;
        if (!goals.some(g => g.id === inspectedGoalId)) {
            setInspectedGoalId(null);
        }
    }, [inspectedGoalId, goals, setInspectedGoalId]);

    useEffect(() => {
        if (goal) {
            setFormState({ 
                name: goal.name, 
                target: goal.target.toString(),
                targetDate: goal.targetDate ? goal.targetDate.split('T')[0] : ''
            });
        }
    }, [goal]);

    const goalContributions = useMemo(() => {
        if (!goal) return [];
        return transactions.filter(tx => tx.goalId === goal.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, goal]);
    
    // --- Trajectory Chart Logic ---
    const chartData = useMemo(() => {
        if (!goal || !goal.targetDate) return [];
        
        const dataPoints = [];
        const startDate = new Date(goal.createdAt);
        const endDate = new Date(goal.targetDate);
        const today = new Date();
        
        // Ensure start date is valid, fallback to first contribution or today if invalid
        const validStartDate = !isNaN(startDate.getTime()) ? startDate : new Date();
        
        // Ideal Line calculation: Linear progression from 0 at start to Target at end
        const totalDurationDays = (endDate.getTime() - validStartDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // Generate monthly points
        let currentDate = new Date(validStartDate);
        currentDate.setDate(1); // Align to month start for cleaner chart
        
        let cumulativeActual = 0;
        // Pre-calculate cumulative actuals by month
        const actualsByMonth: {[key: string]: number} = {};
        
        // Sort transactions chronologically for cumulative sum
        const chronoTransactions = [...goalContributions].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        chronoTransactions.forEach(tx => {
            const d = new Date(tx.date);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            // Simple accumulation up to that month. 
            // Better: Iterate through all months and sum up to that point.
        });

        while (currentDate <= endDate || currentDate <= today) {
             const progressDays = (currentDate.getTime() - validStartDate.getTime()) / (1000 * 60 * 60 * 24);
             const idealValue = totalDurationDays > 0 
                ? (Math.max(0, progressDays) / totalDurationDays) * goal.target 
                : goal.target;
             
             // Calculate actual savings at this point in time
             // Filter transactions that happened BEFORE or ON this currentDate
             // We adjust currentDate to end of month to capture all txs in that month
             const endOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
             
             const actualValue = chronoTransactions
                .filter(tx => new Date(tx.date) <= endOfCurrentMonth)
                .reduce((sum, tx) => {
                    return tx.type === 'expense' ? sum + tx.amount : sum - tx.amount; // Note: In Goal context, Expense = Contribution (+), Income = Withdrawal (-) usually, but check `goalContributions` mapping.
                    // Actually, `addContributionToGoal` creates an EXPENSE (money leaving wallet -> goal).
                    // `withdrawFromGoal` creates an INCOME (money entering wallet <- goal).
                    // So YES: Expense adds to goal balance, Income subtracts.
                }, 0);

             dataPoints.push({
                 date: currentDate.toLocaleDateString(locale, { month: 'short', year: '2-digit' }),
                 ideal: Math.min(idealValue, goal.target), // Cap at target
                 actual: currentDate <= today ? actualValue : null // Only show actual up to today
             });
             
             // Next month
             currentDate.setMonth(currentDate.getMonth() + 1);
             
             // Safety break for extremely long periods
             if (dataPoints.length > 60) break; 
        }
        
        return dataPoints;
    }, [goal, goalContributions, locale]);

    // --- Smart Advice Logic ---
    const smartAdvice = useMemo(() => {
        if (!goal || !goal.targetDate) return null;
        const now = new Date();
        const targetDate = new Date(goal.targetDate);
        
        if (targetDate <= now) return null; // Goal date passed
        
        const monthsRemaining = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth()) + (targetDate.getDate() - now.getDate()) / 30;
        const remainingAmount = goal.target - goal.currentSaved;
        
        if (remainingAmount <= 0) return { type: 'success', message: t('goalDetail.onTrackMessage') };
        
        // Calculate monthly required
        const monthlyRequired = monthsRemaining > 0 ? remainingAmount / monthsRemaining : remainingAmount;
        
        return {
            type: 'action',
            amount: monthlyRequired,
            date: targetDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
        };
    }, [goal, locale, t]);

    if (!goal) return null;

    const handleSave = () => {
        const newTarget = parseFloat(formState.target);
        if (isNaN(newTarget) || newTarget < 0 || formState.name.trim() === '') return;
        
        updateGoal(goal.id, {
            name: formState.name.trim(),
            target: newTarget,
            targetDate: formState.targetDate ? new Date(formState.targetDate).toISOString() : undefined
        });
        setIsEditing(false);
    };
    
    const handleCancel = () => {
        setFormState({ 
            name: goal.name, 
            target: goal.target.toString(),
            targetDate: goal.targetDate ? goal.targetDate.split('T')[0] : ''
        });
        setIsEditing(false);
    }
    
    const handleDelete = () => {
        deleteGoal(goal.id);
    }
    
    const handleWithdraw = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(withdrawAmount);
        if(!isNaN(amount) && amount > 0) {
            withdrawFromGoal(goal.id, amount);
            setWithdrawAmount('');
            setIsWithdrawing(false);
        }
    }
    
    const handleQuickAdd = (amount: number) => {
        addContributionToGoal(goal.id, amount);
    }

    const progress = Math.min((goal.currentSaved / goal.target) * 100, 100);
    const remaining = goal.target - goal.currentSaved;
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });

    // Quick add values based on currency
    const quickAddValues = currency === 'XOF' ? [1000, 5000, 10000] : [10, 50, 100];

    return (
        <>
        <ConfirmationModal 
            isOpen={isConfirmingDelete}
            onClose={() => setIsConfirmingDelete(false)}
            onConfirm={handleDelete}
            title={t('goalDetail.deleteConfirmationTitle')}
            message={t('goalDetail.deleteConfirmationMessage', { name: goal.name })}
            confirmText={t('goalDetail.deleteButton')}
            cancelText={t('goalDetail.cancelButton')}
        />
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-6"
        >
            {/* Header */}
            <div className="flex justify-between items-start">
                <button
                    onClick={() => setInspectedGoalId(null)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    {t('goalDetail.backButton')}
                </button>
                 <div className="flex items-center gap-2">
                    {isEditing ? (
                         <>
                            <button onClick={handleCancel} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full" aria-label={t('goalDetail.cancelButton')}><XIcon className="w-5 h-5"/></button>
                            <button onClick={handleSave} className="p-1.5 text-green-500 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full" aria-label={t('goalDetail.saveButton')}><CheckIcon className="w-5 h-5"/></button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setIsWithdrawing(!isWithdrawing)} className={`p-1.5 rounded-full transition-colors ${isWithdrawing ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`} title={t('goalDetail.withdrawButton')}><MinusIcon className="w-4 h-4"/></button>
                            <button onClick={() => setIsEditing(true)} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full" aria-label={t('goalDetail.editButton')}><EditIcon className="w-4 h-4"/></button>
                            <button onClick={() => setIsConfirmingDelete(true)} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full" aria-label={t('goalDetail.deleteButton')}><TrashIcon className="w-4 h-4"/></button>
                        </>
                    )}
                 </div>
            </div>

            {/* Title & Progress */}
            <div>
                {isEditing ? (
                    <div className="flex flex-col gap-3 mb-4">
                        <input 
                            type="text"
                            value={formState.name}
                            onChange={e => setFormState(s => ({...s, name: e.target.value}))}
                            className="text-xl font-bold bg-zinc-100 dark:bg-zinc-800 rounded-md px-2 py-1 -ml-2 w-full"
                        />
                        <div className="flex items-center gap-2 text-sm">
                            <input 
                                type="number"
                                value={formState.target}
                                onChange={e => setFormState(s => ({...s, target: e.target.value}))}
                                className="bg-zinc-100 dark:bg-zinc-800 rounded-md px-2 py-1 -ml-2 w-40"
                            />
                            <input
                                type="date"
                                value={formState.targetDate}
                                onChange={e => setFormState(s => ({ ...s, targetDate: e.target.value }))}
                                className="bg-zinc-100 dark:bg-zinc-800 rounded-md px-2 py-1"
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <TargetIcon className="w-6 h-6 text-green-500 dark:text-green-400" />
                            {goal.name}
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 mb-3">
                            <span className="font-bold text-zinc-800 dark:text-zinc-100">{formatter.format(goal.currentSaved)}</span> {t('goalDetail.savedOf')} {formatter.format(goal.target)}
                        </p>
                    </>
                )}
                
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-4 mt-3 overflow-hidden">
                    <motion.div 
                        className="bg-green-500 h-4 rounded-full" 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                </div>
                <div className="flex justify-between text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
                    <p>
                        {goal.targetDate && (
                            <span className="font-semibold text-zinc-600 dark:text-zinc-300">{t('goalDetail.targetDate')}: {dateFormatter.format(new Date(goal.targetDate))}</span>
                        )}
                    </p>
                    <p>{formatter.format(remaining > 0 ? remaining : 0)} {t('goalDetail.remaining')}</p>
                </div>
            </div>

            {/* Action Cards (Smart Advice & Quick Add) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Smart Advice */}
                {smartAdvice && (
                    <div className={`p-4 rounded-lg border ${smartAdvice.type === 'success' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30' : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30'}`}>
                        <div className="flex items-start gap-3">
                            <SparklesIcon className={`w-5 h-5 mt-0.5 ${smartAdvice.type === 'success' ? 'text-green-600' : 'text-blue-600'}`} />
                            <div>
                                <h4 className={`text-sm font-bold ${smartAdvice.type === 'success' ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}`}>
                                    {smartAdvice.type === 'success' ? "Goal Reached!" : t('goalDetail.requiredSavingsTitle')}
                                </h4>
                                <p className="text-xs mt-1 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    {smartAdvice.type === 'success' 
                                        ? smartAdvice.message 
                                        : t('goalDetail.requiredSavingsDesc', { date: smartAdvice.date, amount: formatter.format(smartAdvice.amount) })
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Add */}
                <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/50">
                    <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                        <PlusIcon className="w-4 h-4"/> {t('goalDetail.quickAdd')}
                    </h4>
                    <div className="flex gap-2">
                        {quickAddValues.map(val => (
                            <button
                                key={val}
                                onClick={() => handleQuickAdd(val)}
                                className="px-3 py-1.5 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded text-xs font-semibold hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-500 dark:hover:border-green-500 transition-colors"
                            >
                                +{val}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Trajectory Chart */}
            {chartData.length > 1 && (
                <div className="h-48 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid stroke={theme === 'dark' ? '#27272a' : '#e4e4e7'} strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} dy={10} stroke={theme === 'dark' ? '#71717a' : '#a1a1aa'} minTickGap={20} />
                            <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => new Intl.NumberFormat(locale, { notation: "compact" }).format(val)} stroke={theme === 'dark' ? '#71717a' : '#a1a1aa'} />
                            <Tooltip content={<CustomTooltip currency={currency} locale={locale} />} />
                            <Legend verticalAlign="top" iconType="plainline" height={20} wrapperStyle={{ fontSize: '10px' }}/>
                            <Line type="monotone" dataKey="ideal" name={t('goalDetail.idealTrajectory')} stroke="#a1a1aa" strokeWidth={1} strokeDasharray="5 5" dot={false} activeDot={false} />
                            <Line type="monotone" dataKey="actual" name={t('goalDetail.actualSavings')} stroke="#10B981" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
            
            {/* Withdrawal Form */}
            <AnimatePresence>
                {isWithdrawing && (
                    <motion.form 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onSubmit={handleWithdraw}
                        className="bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-lg flex items-center gap-2 overflow-hidden"
                    >
                        <input 
                            type="number" 
                            placeholder={t('goalDetail.withdrawPlaceholder')}
                            value={withdrawAmount}
                            onChange={e => setWithdrawAmount(e.target.value)}
                            className="flex-grow bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                            autoFocus
                        />
                        <button type="submit" className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-3 py-1 text-sm font-semibold rounded hover:opacity-90">{t('goalDetail.withdrawAction')}</button>
                    </motion.form>
                )}
            </AnimatePresence>
            
            {/* Transactions List */}
            <div>
                <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2">{t('goalDetail.contributionsTitle')}</h4>
                {goalContributions.length > 0 ? (
                    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {goalContributions.map(tx => (
                            <GoalContributionItem key={tx.id} transaction={tx} />
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-sm text-zinc-400 dark:text-zinc-500 py-6">{t('goalDetail.empty')}</p>
                )}
            </div>
        </motion.div>
        </>
    );
};

export default GoalDetailWidget;
