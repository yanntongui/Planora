
import React, { useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { SubCategory, Bucket, BudgetMethod, BudgetingRule } from '../../types';
import { getBucketForCategory } from '../../lib/rule-mapper';
import TableIcon from '../icons/TableIcon';
import XIcon from '../icons/XIcon';
import PlusIcon from '../icons/PlusIcon';
import RefreshCwIcon from '../icons/RefreshCwIcon';
import SparklesIcon from '../icons/SparklesIcon';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../ConfirmationModal';
import { useToast } from '../../context/ToastContext';
import CheckIcon from '../icons/CheckIcon';

type EnrichedSubCategory = SubCategory & {
  actualAmount: number;
  difference: number;
  differencePercent: number;
  status: 'ok' | 'warning' | 'good';
  bucket: Bucket;
};

const EditableAmount: React.FC<{ item: SubCategory }> = ({ item }) => {
    const { updateSubCategory } = useFinance();
    const { locale, currency } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(item.plannedAmount.toString());
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 });

    const handleBlur = () => {
        const newValue = parseFloat(value);
        if (!isNaN(newValue)) {
            updateSubCategory(item.id, newValue);
        }
        setIsEditing(false);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setValue(item.plannedAmount.toString());
            setIsEditing(false);
        }
    }

    if (isEditing) {
        return (
            <input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-20 sm:w-24 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded px-2 py-1 text-right text-xs sm:text-sm"
                autoFocus
            />
        );
    }

    return (
        <span onClick={() => setIsEditing(true)} className="cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 rounded px-2 py-1 whitespace-nowrap">
            {formatter.format(item.plannedAmount)}
        </span>
    );
};

const NewSubCategoryRow: React.FC<{ bucket: 'needs' | 'wants' | 'savings', onSave: () => void, onCancel: () => void }> = ({ bucket, onSave, onCancel }) => {
    const { addSubCategory } = useFinance();
    const { t } = useLanguage();
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');

    const bucketToCategoryIdMap = {
        needs: 'billsAndUtilities',
        wants: 'entertainment',
        savings: 'general'
    };

    const handleSave = () => {
        const plannedAmount = parseFloat(amount);
        if (name.trim() && !isNaN(plannedAmount) && plannedAmount > 0) {
            addSubCategory({
                name: name.trim(),
                plannedAmount,
                categoryId: bucketToCategoryIdMap[bucket]
            });
            onSave();
        }
    };
    
    return (
        <tr className="bg-zinc-200 dark:bg-zinc-800">
            <td className="px-2 sm:px-4 py-2">
                 <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('tableBudget.namePlaceholder')} className="w-full bg-zinc-100 dark:bg-zinc-700 rounded px-2 py-1 text-xs sm:text-sm" autoFocus />
            </td>
            <td className="px-2 sm:px-4 py-2">
                 <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={t('tableBudget.amountPlaceholder')} className="w-full bg-zinc-100 dark:bg-zinc-700 rounded px-2 py-1 text-xs sm:text-sm text-right" />
            </td>
            <td className="px-2 sm:px-4 py-2 text-right" colSpan={5}>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white px-2 py-1 text-xs sm:text-sm rounded">{t('tableBudget.cancel')}</button>
                    <button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-2 py-1 text-xs sm:text-sm rounded">{t('tableBudget.save')}</button>
                </div>
            </td>
        </tr>
    )
}


const TableBudgetWidget: React.FC = () => {
  const { subCategories, transactions, deleteSubCategory, categories, budgetingRule, setBudgetingRule, applyRuleToSubCategories, scaleSubCategoriesToRule, monthlyPlan, applyPlanToBudgets } = useFinance();
  const { t, locale, currency } = useLanguage();
  const { showToast } = useToast();
  const [addingToBucket, setAddingToBucket] = useState<'needs' | 'wants' | 'savings' | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Method switching state logic
  // We determine the 'current' method based on the rule object values
  const currentMethod: BudgetMethod | 'custom' = useMemo(() => {
      if (!budgetingRule) return 'custom';
      const { needs, wants, savings } = budgetingRule;
      if (needs === 50 && wants === 30 && savings === 20) return '50/30/20';
      if (needs === 60 && wants === 30 && savings === 10) return '60/30/10';
      if (needs === 80 && wants === 0 && savings === 20) return '80/20';
      return 'custom';
  }, [budgetingRule]);

  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const method = e.target.value;
      let newRule: BudgetingRule | null = null;
      
      switch(method) {
          case '50/30/20': newRule = { needs: 50, wants: 30, savings: 20 }; break;
          case '60/30/10': newRule = { needs: 60, wants: 30, savings: 10 }; break;
          case '80/20': newRule = { needs: 80, wants: 0, savings: 20 }; break;
          default: break;
      }
      
      if (newRule) {
          setBudgetingRule(newRule);
          // Note: we do NOT regenerate subcategories automatically here, allowing "Freedom of modification"
      }
  };

  const handleRegenerate = () => {
      if (budgetingRule) {
          applyRuleToSubCategories(budgetingRule, t);
      }
  }

  const handleAdjustAmounts = () => {
      if (budgetingRule) {
          scaleSubCategoriesToRule(budgetingRule);
          showToast(t('tableBudget.adjustSuccess'));
      }
  }
  
  const handleApplyPlan = () => {
      applyPlanToBudgets();
      showToast(t('tableBudget.planSaved'));
  }

  const { enrichedData, totals } = useMemo(() => {
    const now = new Date();
    const currentMonthTxs = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    });

    const data = subCategories.map(sub => {
      const actualAmount = currentMonthTxs
        .filter(tx => tx.type === 'expense' && (
            (tx.label && tx.label.toLowerCase().includes(sub.name.toLowerCase().trim())) || 
            (sub.categoryId === 'general' && tx.goalId) // Match savings
        ))
        .reduce((sum, tx) => sum + tx.amount, 0);

      const difference = sub.plannedAmount - actualAmount;
      const differencePercent = sub.plannedAmount > 0 ? (difference / sub.plannedAmount) * 100 : 0;
      
      const categoryObj = categories.find(c => c.id === sub.categoryId);
      const bucket = categoryObj ? categoryObj.bucket : getBucketForCategory(sub.categoryId);
      
      let status: 'ok' | 'warning' | 'good' = 'ok';
      if (bucket === 'savings') {
          if (actualAmount >= sub.plannedAmount) status = 'good';
      } else {
          if (actualAmount > sub.plannedAmount) status = 'warning';
      }

      return { ...sub, actualAmount, difference, differencePercent, status, bucket };
    });

    const calcTotals = data.reduce((acc, item) => {
        acc.planned += item.plannedAmount;
        acc.actual += item.actualAmount;
        return acc;
    }, { planned: 0, actual: 0 });

    return { enrichedData: data, totals: calcTotals };

  }, [subCategories, transactions, categories]);

  const groupedData = useMemo(() => {
    return enrichedData.reduce((acc, item) => {
      const bucket = item.bucket;
      if (!acc[bucket]) {
        acc[bucket] = [];
      }
      acc[bucket].push(item);
      return acc;
    }, {} as Record<'needs' | 'wants' | 'savings', EnrichedSubCategory[]>);
  }, [enrichedData]);


  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 });

  const renderStatus = (status: 'ok' | 'warning' | 'good') => {
    if (status === 'good') return <span className="text-lg" title="Good">✅</span>;
    if (status === 'warning') return <span className="text-lg" title="Warning">⚠️</span>;
    return <span className="text-zinc-300 dark:text-zinc-600 text-xs" title="OK">•</span>;
  };

  const headers = [
    t('tableBudget.subCategory'), t('tableBudget.planned'), t('tableBudget.actual'),
    t('tableBudget.differenceAmount', { currency }),
    t('tableBudget.differencePercent'),
    t('tableBudget.status'), ''
  ];

  const buckets: Array<'needs'|'wants'|'savings'> = ['needs', 'wants', 'savings'];
  const income = monthlyPlan?.plannedIncome || 0;

  return (
    <>
    <ConfirmationModal 
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleRegenerate}
        title={t('tableBudget.resetTitle')}
        message={t('tableBudget.resetMessage')}
        confirmText={t('tableBudget.resetConfirm')}
        cancelText={t('sidebar.cancelButton')}
    />
    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            {t('tableBudget.title')}
          </h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
              <select 
                value={currentMethod} 
                onChange={handleMethodChange}
                className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                  <option value="custom">Custom</option>
                  <option value="50/30/20">50/30/20</option>
                  <option value="60/30/10">60/30/10</option>
                  <option value="80/20">80/20</option>
              </select>
              {budgetingRule && (
                  <button 
                    onClick={handleAdjustAmounts}
                    className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors"
                    title={t('tableBudget.adjustTooltip')}
                  >
                      <SparklesIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t('tableBudget.adjust')}</span>
                  </button>
              )}
              <button 
                onClick={() => setIsResetConfirmOpen(true)}
                className="flex items-center gap-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors"
                title={t('tableBudget.regenerateTooltip')}
              >
                  <RefreshCwIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('tableBudget.regenerate')}</span>
              </button>
          </div>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-xs sm:text-sm text-left">
          <thead className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-100/50 dark:bg-zinc-800/30">
            <tr>{headers.map((h, i) => <th key={i} scope="col" className={`px-2 sm:px-4 py-2 whitespace-nowrap ${i > 0 ? 'text-right' : ''}`}>{h}</th>)}</tr>
          </thead>
          <tbody>
            <AnimatePresence>
            {buckets.map((bucket) => {
                const bucketData = groupedData[bucket] || [];
                const bucketPlanned = bucketData.reduce((sum, item) => sum + item.plannedAmount, 0);
                const targetPercent = budgetingRule ? budgetingRule[bucket] : 0;
                const targetAmount = income * (targetPercent / 100);
                
                // Alert logic
                const actualPercent = income > 0 ? Math.round((bucketPlanned / income) * 100) : 0;
                const deviation = actualPercent - targetPercent;
                const isDeviationSignificant = Math.abs(deviation) >= 5; // Alert if off by 5%
                const alertColor = isDeviationSignificant ? 'text-orange-500 dark:text-orange-400' : 'text-zinc-400 dark:text-zinc-500';

                return (
                  <React.Fragment key={bucket}>
                    <tr className="bg-zinc-100 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-700">
                      <td colSpan={headers.length} className="px-2 sm:px-4 py-2 font-bold text-zinc-800 dark:text-zinc-200">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <div className="flex items-center gap-2">
                              <span className="capitalize">{t(`ruleBudget.${bucket}`)}</span>
                              {budgetingRule && (
                                  <span className="text-[10px] sm:text-xs font-normal bg-zinc-200 dark:bg-zinc-700 px-1.5 rounded text-zinc-600 dark:text-zinc-400">
                                      {t('tableBudget.target')}: {targetPercent}% ({formatter.format(targetAmount)})
                                  </span>
                              )}
                          </div>
                          <div className="flex items-center gap-2">
                              {budgetingRule && (
                                <span className={`text-[10px] sm:text-xs font-normal ${alertColor}`}>
                                    {t('tableBudget.currentPlan')}: {actualPercent}% {isDeviationSignificant ? `(${deviation > 0 ? '+' : ''}${deviation}%) ⚠️` : ''}
                                </span>
                              )}
                              <button onClick={() => setAddingToBucket(bucket)} className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors p-1" title={t('tableBudget.addLine')}>
                                <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                     {bucketData.length === 0 && addingToBucket !== bucket && (
                        <tr>
                            <td colSpan={headers.length} className="px-4 py-3 text-center text-zinc-400 dark:text-zinc-500 text-xs italic">
                               {t('tableBudget.empty')}
                            </td>
                        </tr>
                    )}
                    {bucketData.map(item => (
                      <motion.tr 
                        key={item.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                        className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                      >
                        <td className="px-2 sm:px-4 py-2 font-medium text-zinc-800 dark:text-zinc-100 capitalize whitespace-nowrap max-w-[100px] sm:max-w-none truncate">{item.name}</td>
                        <td className="px-2 sm:px-4 py-2 text-right"><EditableAmount item={item} /></td>
                        <td className="px-2 sm:px-4 py-2 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400">{formatter.format(item.actualAmount)}</td>
                        <td className={`px-2 sm:px-4 py-2 font-medium text-right whitespace-nowrap ${item.difference < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                            {item.difference > 0 ? '+' : ''}{formatter.format(item.difference)}
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-right text-zinc-400 dark:text-zinc-500 text-[10px] sm:text-xs">
                          {item.differencePercent > 0 ? '+' : ''}{item.differencePercent.toFixed(0)}%
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-right sm:text-center">{renderStatus(item.status)}</td>
                        <td className="px-2 sm:px-4 py-2 text-right sm:text-center">
                            <button onClick={() => deleteSubCategory(item.id)} className="text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors" aria-label={t('tableBudget.deleteAriaLabel')}>
                                <XIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                        </td>
                      </motion.tr>
                    ))}
                    {addingToBucket === bucket && <NewSubCategoryRow bucket={bucket} onSave={() => setAddingToBucket(null)} onCancel={() => setAddingToBucket(null)} />}
                  </React.Fragment>
                );
            })}
            </AnimatePresence>
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-zinc-200 dark:border-zinc-700 font-bold bg-zinc-50 dark:bg-zinc-900/50">
                <td className="px-2 sm:px-4 py-3 text-zinc-800 dark:text-zinc-100 uppercase text-xs">{t('tableBudget.total')}</td>
                <td className="px-2 sm:px-4 py-3 text-right text-zinc-800 dark:text-zinc-100 whitespace-nowrap">{formatter.format(totals.planned)}</td>
                <td className="px-2 sm:px-4 py-3 text-right text-zinc-800 dark:text-zinc-100 whitespace-nowrap">{formatter.format(totals.actual)}</td>
                <td colSpan={4}></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div className="mt-4 flex justify-end">
          <button 
            onClick={handleApplyPlan}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-semibold text-sm transition-colors shadow-sm"
          >
              <CheckIcon className="w-4 h-4" />
              {t('tableBudget.applyPlan')}
          </button>
      </div>
    </div>
    </>
  );
};

export default TableBudgetWidget;
