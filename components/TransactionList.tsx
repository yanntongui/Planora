
import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Transaction } from '../types';
import XIcon from './icons/XIcon';
import TargetIcon from './icons/TargetIcon';
import EditIcon from './icons/EditIcon';
import CheckIcon from './icons/CheckIcon';
import SearchIcon from './icons/SearchIcon';
import FilterIcon from './icons/FilterIcon';
import ReceiptIcon from './icons/ReceiptIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategoryIcon } from '../lib/category-helpers';

const ImageModal: React.FC<{ isOpen: boolean; imageSrc: string | undefined; onClose: () => void }> = ({ isOpen, imageSrc, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && imageSrc && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.9 }}
                        className="relative max-w-full max-h-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={onClose}
                            className="absolute -top-10 right-0 p-2 text-white hover:text-zinc-300"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                        <img src={imageSrc} alt="Receipt" className="rounded-lg max-w-full max-h-[90vh] object-contain shadow-2xl" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const { deleteTransaction, updateTransaction, addTransaction, categories } = useFinance();
  const { t, locale, currency } = useLanguage();
  const { showToast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const [formState, setFormState] = useState({
      label: transaction.label,
      amount: transaction.amount.toString(),
      category: transaction.category,
      date: transaction.date.split('T')[0]
  });

  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? 'text-green-600 dark:text-green-400' : 'text-zinc-800 dark:text-zinc-100';
  const circleBgColor = isIncome ? 'bg-green-100 dark:bg-green-500/10' : 'bg-zinc-100 dark:bg-zinc-800';
  const iconColor = isIncome ? 'text-green-600 dark:text-green-500' : 'text-zinc-600 dark:text-zinc-400';
  
  const CategoryIcon = getCategoryIcon(transaction.category);
  
  const categoryLabel = useMemo(() => {
      const cat = categories.find(c => c.id === transaction.category);
      if (cat) return cat.isCustom ? cat.name : t(cat.name);
      return t(`categories.${transaction.category}`);
  }, [categories, transaction.category, t]);

  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: currency });
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTransaction(transaction.id);
    showToast(t('history.deletedMessage'), {
        label: t('history.undo'),
        onClick: () => {
            const { id, ...rest } = transaction; 
            addTransaction(rest);
        }
    });
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };
  
  const handleCancel = () => setIsEditing(false);

  const handleSave = () => {
    const amount = parseFloat(formState.amount);
    if (formState.label.trim() && !isNaN(amount) && amount > 0) {
        updateTransaction(transaction.id, {
            ...formState,
            amount,
            date: new Date(formState.date).toISOString()
        });
        setIsEditing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  if (isEditing) {
    return (
        <motion.li layout className="py-3 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-purple-500">
            <div className="flex items-center gap-2 mb-2">
                 <input type="text" name="label" value={formState.label} onChange={handleInputChange} className="flex-grow min-w-0 bg-zinc-200 dark:bg-zinc-700 rounded px-2 py-1 font-medium text-zinc-800 dark:text-zinc-100 text-sm" />
                 <input type="number" name="amount" value={formState.amount} onChange={handleInputChange} className="w-20 bg-zinc-200 dark:bg-zinc-700 rounded px-2 py-1 font-semibold text-right text-sm" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 flex-grow">
                    <select name="category" value={formState.category} onChange={handleInputChange} className="bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 rounded text-xs text-zinc-600 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-purple-500 max-w-[120px]">
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.isCustom ? cat.name : t(cat.name)}</option>)}
                    </select>
                    <input type="date" name="date" value={formState.date} onChange={handleInputChange} className="bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 rounded text-xs text-zinc-600 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-purple-500" />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleCancel} className="p-1 text-zinc-500 hover:text-red-500"><XIcon className="w-5 h-5"/></button>
                    <button onClick={handleSave} className="p-1 text-zinc-500 hover:text-green-500"><CheckIcon className="w-5 h-5"/></button>
                </div>
            </div>
        </motion.li>
    )
  }

  return (
    <>
    <ImageModal isOpen={showReceipt} imageSrc={transaction.receiptImage} onClose={() => setShowReceipt(false)} />
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="group relative flex items-center justify-between py-3 px-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors gap-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${circleBgColor}`}>
          <CategoryIcon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate text-sm sm:text-base">{transaction.label}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="truncate max-w-[100px]">{categoryLabel}</span>
            {transaction.budgetId && <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap">Budget</span>}
            {transaction.goalId && <span className="flex items-center gap-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"><TargetIcon className="w-3 h-3"/> Goal</span>}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <p className={`font-bold ${amountColor} text-sm sm:text-base whitespace-nowrap`}>
          {isIncome ? '+' : ''}{formatter.format(transaction.amount)}
        </p>
        <div className={`flex items-center gap-1 transition-opacity duration-200 ${isHovered || transaction.receiptImage ? 'opacity-100' : 'opacity-0'} md:opacity-0 md:group-hover:opacity-100`}>
             {transaction.receiptImage && (
                 <button onClick={(e) => { e.stopPropagation(); setShowReceipt(true); }} className="p-1.5 text-zinc-400 hover:text-purple-500 rounded-md transition-colors" title="View Receipt">
                    <ReceiptIcon className="w-4 h-4" />
                 </button>
             )}
             <button onClick={handleEdit} className="p-1.5 text-zinc-400 hover:text-blue-500 rounded-md transition-colors" aria-label={t('history.editAriaLabel')}>
                <EditIcon className="w-4 h-4" />
            </button>
            <button onClick={handleDelete} className="p-1.5 text-zinc-400 hover:text-red-500 rounded-md transition-colors" aria-label={t('history.deleteAriaLabel')}>
                <XIcon className="w-4 h-4" />
            </button>
        </div>
      </div>
    </motion.li>
    </>
  );
};

const TransactionList: React.FC = () => {
  const { transactions, categories } = useFinance();
  const { t, locale } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(15);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = tx.label.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || tx.category === categoryFilter;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, searchTerm, typeFilter, categoryFilter]);

  const visibleTransactions = filteredTransactions.slice(0, visibleCount);
  
  const groupedTransactions = useMemo(() => {
      const groups: { [key: string]: Transaction[] } = {};
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      visibleTransactions.forEach(tx => {
          const date = new Date(tx.date);
          let label = date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
          
          if (date.toDateString() === today.toDateString()) label = t('date.today');
          else if (date.toDateString() === yesterday.toDateString()) label = t('date.yesterday');
          
          if (!groups[label]) groups[label] = [];
          groups[label].push(tx);
      });
      return groups;
  }, [visibleTransactions, locale, t]);

  const groupKeys = Object.keys(groupedTransactions);
  const isFreshState = transactions.length === 0;

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t('history.title')}</h3>
        
        {!isFreshState && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-auto">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                        type="text" 
                        placeholder={t('history.searchPlaceholder')} 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-40 pl-9 pr-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-grow sm:flex-grow-0">
                        <select 
                            value={typeFilter} 
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                            className="w-full appearance-none bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md py-1.5 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                            <option value="all">{t('history.typeAll')}</option>
                            <option value="income">{t('history.typeIncome')}</option>
                            <option value="expense">{t('history.typeExpense')}</option>
                        </select>
                        <FilterIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" />
                    </div>

                    <div className="relative flex-grow sm:flex-grow-0">
                        <select 
                            value={categoryFilter} 
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full appearance-none bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md py-1.5 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 max-w-[120px] truncate"
                        >
                            <option value="all">{t('history.categoryAll')}</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.isCustom ? cat.name : t(cat.name)}</option>
                            ))}
                        </select>
                        <FilterIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" />
                    </div>
                </div>
            </div>
        )}
      </div>

      {visibleTransactions.length > 0 ? (
        <>
            <div className="space-y-4">
            <AnimatePresence initial={false}>
                {groupKeys.map(dateLabel => (
                    <div key={dateLabel}>
                         <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 sticky top-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm py-1 z-10">{dateLabel}</h4>
                         <ul className="space-y-1">
                             {groupedTransactions[dateLabel].map(tx => (
                                 <TransactionItem key={tx.id} transaction={tx} />
                             ))}
                         </ul>
                    </div>
                ))}
            </AnimatePresence>
            </div>
            {visibleCount < filteredTransactions.length && (
                <button 
                    onClick={() => setVisibleCount(prev => prev + 10)}
                    className="w-full py-3 mt-4 text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                >
                    {t('history.showMore')}
                </button>
            )}
        </>
      ) : (
        <div className="text-center">
             <p className="text-zinc-500 dark:text-zinc-500 py-10">{isFreshState ? t('history.empty') : t('history.noResults')}</p>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
