
import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { Debt, Installment } from '../../types';
import UsersIcon from '../icons/UsersIcon';
import XIcon from '../icons/XIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import { motion, AnimatePresence } from 'framer-motion';
import TrashIcon from '../icons/TrashIcon';
import CalendarIcon from '../icons/CalendarIcon';
import EditIcon from '../icons/EditIcon';
import ArrowUpCircleIcon from '../icons/ArrowUpCircleIcon';
import ArrowDownCircleIcon from '../icons/ArrowDownCircleIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';

const InstallmentRow: React.FC<{ installment: Installment, debtId: string, isCapacityWarning: boolean }> = ({ installment, debtId, isCapacityWarning }) => {
    const { toggleDebtInstallment, updateDebtInstallment } = useFinance();
    const { locale, currency } = useLanguage();
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
    const [isEditing, setIsEditing] = useState(false);
    const [amount, setAmount] = useState(installment.amount.toString());

    const handleBlur = () => {
        const val = parseFloat(amount);
        if (!isNaN(val) && val >= 0) {
            updateDebtInstallment(debtId, installment.id, val);
        } else {
            setAmount(installment.amount.toString());
        }
        setIsEditing(false);
    };

    return (
        <div className={`flex items-center justify-between p-2 rounded text-sm ${installment.isPaid ? 'bg-green-50 dark:bg-green-900/10 opacity-60' : 'bg-white dark:bg-zinc-800'}`}>
            <div className="flex items-center gap-3">
                <input 
                    type="checkbox" 
                    checked={installment.isPaid} 
                    onChange={() => toggleDebtInstallment(debtId, installment.id)}
                    className="w-4 h-4 rounded border-zinc-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <span className="text-zinc-600 dark:text-zinc-300 w-24">
                    {new Date(installment.date).toLocaleDateString(locale, { month: 'short', year: 'numeric' })}
                </span>
            </div>
            <div className="flex items-center gap-2">
                {isCapacityWarning && !installment.isPaid && (
                    <span className="text-orange-500" title="This exceeds your safe monthly limit">⚠️</span>
                )}
                {isEditing ? (
                    <input 
                        type="number" 
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        onBlur={handleBlur}
                        autoFocus
                        className="w-20 text-right bg-zinc-100 dark:bg-zinc-700 rounded px-1 py-0.5 border border-purple-500 focus:outline-none"
                    />
                ) : (
                    <span 
                        onClick={() => !installment.isPaid && setIsEditing(true)} 
                        className={`font-mono font-medium cursor-pointer hover:underline ${installment.isPaid ? 'text-zinc-400 line-through' : 'text-zinc-800 dark:text-zinc-200'}`}
                    >
                        {formatter.format(installment.amount)}
                    </span>
                )}
            </div>
        </div>
    )
}

const DebtCard: React.FC<{ item: Debt }> = ({ item }) => {
    const { recordDebtPayment, markDebtAsPaid, deleteDebt, updateDebt, monthlyPlan, budgets, transactions } = useFinance();
    const { t, locale, currency } = useLanguage();
    const [isPaying, setIsPaying] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [isEditingDate, setIsEditingDate] = useState(false);
    const [dateInput, setDateInput] = useState(item.dueDate ? item.dueDate.split('T')[0] : '');
    const [isExpanded, setIsExpanded] = useState(false);

    const isDebt = item.type === 'debt';
    const progress = item.totalAmount > 0 ? (item.paidAmount / item.totalAmount) * 100 : 100;
    const remaining = item.totalAmount - item.paidAmount;

    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
    
    // Capacity Check Logic
    const safeMonthlyCapacity = useMemo(() => {
        if (!monthlyPlan || monthlyPlan.plannedIncome === 0) return Infinity; // No data to check
        
        // Calculate average essential expenses (Needs)
        // Heuristic: Sum of budgets tagged 'needs' OR explicit monthly average of 'needs' categories
        const needsBudgets = budgets.filter(b => {
            // Check if monthly budget is essential
            if (b.type === 'monthly') {
                return ['foodAndDining', 'transport', 'billsAndUtilities', 'health'].includes(b.category || '');
            }
            return false;
        }).reduce((sum, b) => sum + b.limit, 0);

        // Simple disposable income estimation
        const disposable = monthlyPlan.plannedIncome - needsBudgets;
        // Safety buffer: 20%
        return Math.max(0, disposable * 0.8);
    }, [monthlyPlan, budgets]);

    // Date Logic
    const isOverdue = useMemo(() => {
        if (!item.dueDate || item.status === 'paid') return false;
        const today = new Date();
        today.setHours(0,0,0,0);
        const due = new Date(item.dueDate);
        return due < today;
    }, [item.dueDate, item.status]);

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(paymentAmount);
        if (!isNaN(amount) && amount > 0) {
            recordDebtPayment(item.person, amount, isDebt ? 'payment' : 'repayment');
            setIsPaying(false);
            setPaymentAmount('');
        }
    };
    
    const handleDateSave = () => {
        if (dateInput) {
            updateDebt(item.id, { dueDate: new Date(dateInput).toISOString() });
        } else {
            updateDebt(item.id, { dueDate: undefined });
        }
        setIsEditingDate(false);
    }
    
    const handleDelete = () => {
        if(confirm(t('debt.deleteConfirmation'))) {
            deleteDebt(item.id);
        }
    }

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`p-4 rounded-xl border transition-all ${
                item.status === 'paid' 
                    ? 'bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 opacity-60' 
                    : isOverdue 
                        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 shadow-sm'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm'
            }`}
        >
            <div className="flex justify-between items-start mb-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg capitalize flex items-center gap-2">
                        {item.person}
                        {isOverdue && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Late</span>}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wide mt-0.5">
                        {t(isDebt ? 'debt.youOwe' : 'debt.owedToYou')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <p className={`font-mono font-bold text-lg ${isDebt ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {formatter.format(item.totalAmount)}
                    </p>
                    <ChevronDownIcon className={`w-4 h-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Date Section */}
            <div className="flex items-center gap-2 mb-3">
                {isEditingDate ? (
                    <div className="flex items-center gap-1">
                        <input 
                            type="date" 
                            value={dateInput}
                            onChange={(e) => setDateInput(e.target.value)}
                            className="bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-700"
                        />
                        <button onClick={handleDateSave} className="p-1 text-green-600 hover:bg-green-100 rounded"><CheckCircleIcon className="w-4 h-4"/></button>
                        <button onClick={() => setIsEditingDate(false)} className="p-1 text-zinc-500 hover:bg-zinc-200 rounded"><XIcon className="w-4 h-4"/></button>
                    </div>
                ) : (
                    <button 
                        onClick={() => item.status !== 'paid' && setIsEditingDate(true)}
                        className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors ${
                            item.dueDate 
                                ? (isOverdue ? 'text-red-600 bg-red-100 dark:bg-red-900/30' : 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800')
                                : 'text-zinc-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                        }`}
                    >
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {item.dueDate ? new Date(item.dueDate).toLocaleDateString(locale) : 'Set due date'}
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-1">
                <div 
                    className={`absolute top-0 left-0 h-full transition-all duration-500 ${item.status === 'paid' ? 'bg-green-500' : isDebt ? 'bg-zinc-400 dark:bg-zinc-600' : 'bg-purple-500'}`} 
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                <span>{Math.round(progress)}% paid</span>
                <span>{item.status === 'paid' ? t('debt.paid') : t('debt.remaining', { amount: formatter.format(remaining) })}</span>
            </div>
            
            {/* Installments / Schedule */}
            <AnimatePresence>
                {isExpanded && item.installments && item.installments.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-2 border border-zinc-100 dark:border-zinc-800"
                    >
                        <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 pl-1">Repayment Schedule</h5>
                        <div className="space-y-1">
                            {item.installments.map(inst => (
                                <InstallmentRow 
                                    key={inst.id} 
                                    installment={inst} 
                                    debtId={item.id} 
                                    isCapacityWarning={inst.amount > safeMonthlyCapacity}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
             <AnimatePresence>
                {isPaying && (
                    <motion.form 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handlePaymentSubmit} className="mb-3 flex gap-2"
                    >
                        <input
                            type="number"
                            step="0.01"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder={t('debt.paymentAmount')}
                            className="flex-grow bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            autoFocus
                        />
                         <button type="button" onClick={() => {setIsPaying(false); setPaymentAmount('')}} className="px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">{t('debt.cancel')}</button>
                        <button type="submit" className="px-3 py-1.5 text-sm rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 shadow-sm">{t('debt.savePayment')}</button>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-end gap-3">
               {item.status === 'active' && (
                   <>
                       <button onClick={() => setIsPaying(prev => !prev)} className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors uppercase tracking-wide">{t('debt.recordPayment')}</button>
                       <button onClick={() => markDebtAsPaid(item.id)} className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-400 transition-colors uppercase tracking-wide">{t('debt.markAsPaid')}</button>
                   </>
               )}
                <button onClick={handleDelete} className="text-zinc-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"><TrashIcon className="w-4 h-4" /></button>
            </div>
        </motion.div>
    );
};

const DebtSummary: React.FC<{ owed: number, owedToYou: number }> = ({ owed, owedToYou }) => {
    const { t, locale, currency } = useLanguage();
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 });
    const net = owedToYou - owed;
    const isPositive = net >= 0;

    return (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
            <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/30 text-center">
                <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider mb-1">{t('debt.summaryYouOwe')}</p>
                <p className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100">{formatter.format(owed)}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-xl border border-green-100 dark:border-green-900/30 text-center">
                <p className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wider mb-1">{t('debt.summaryOwedToYou')}</p>
                <p className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100">{formatter.format(owedToYou)}</p>
            </div>
            <div className={`p-3 rounded-xl border text-center flex flex-col justify-center ${isPositive ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30' : 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isPositive ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>{t('debt.netPosition')}</p>
                <p className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100">{formatter.format(net)}</p>
            </div>
        </div>
    )
}

const DebtWidget: React.FC = () => {
    const { debts } = useFinance();
    const { t } = useLanguage();

    const { debtsOwed, loansOwedToUser, totalOwed, totalLoans } = useMemo(() => {
        const debtsOwed = debts.filter(d => d.type === 'debt');
        const loansOwedToUser = debts.filter(d => d.type === 'loan');
        
        const totalOwed = debtsOwed.filter(d => d.status === 'active').reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);
        const totalLoans = loansOwedToUser.filter(d => d.status === 'active').reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);

        return { debtsOwed, loansOwedToUser, totalOwed, totalLoans };
    }, [debts]);

    return (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                {t('debt.title')}
            </h3>

            <DebtSummary owed={totalOwed} owedToYou={totalLoans} />

            {debts.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-500 text-sm text-center py-10 bg-zinc-100/50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
                    {t('debt.empty')}
                </p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-bold text-zinc-500 dark:text-zinc-400 uppercase text-xs tracking-wider mb-3 flex items-center gap-2">
                            <ArrowDownCircleIcon className="w-4 h-4 text-red-500"/>
                            {t('debt.youOwe')}
                        </h4>
                        <div className="space-y-3">
                            <AnimatePresence>
                                {debtsOwed.length > 0 ? debtsOwed.map(item => <DebtCard key={item.id} item={item} />) : <p className="text-xs text-zinc-400 italic">No active debts.</p>}
                            </AnimatePresence>
                        </div>
                    </div>
                     <div>
                        <h4 className="font-bold text-zinc-500 dark:text-zinc-400 uppercase text-xs tracking-wider mb-3 flex items-center gap-2">
                            <ArrowUpCircleIcon className="w-4 h-4 text-green-500"/>
                            {t('debt.owedToYou')}
                        </h4>
                        <div className="space-y-3">
                            <AnimatePresence>
                                {loansOwedToUser.length > 0 ? loansOwedToUser.map(item => <DebtCard key={item.id} item={item} />) : <p className="text-xs text-zinc-400 italic">No active loans.</p>}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebtWidget;
