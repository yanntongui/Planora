
import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { BudgetMethod } from '../../types';
import { motion } from 'framer-motion';
import SparklesIcon from '../icons/SparklesIcon';
import LoaderIcon from '../icons/LoaderIcon';

const BudgetCreationWidget: React.FC = () => {
    const { budgetCreationState, setBudgetIncome, generateBudgetFromMethod, cancelBudgetCreation, transactions } = useFinance();
    const { t, locale, currency } = useLanguage();
    const [incomeInput, setIncomeInput] = useState('');

    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });

    const hasEnoughDataForAI = useMemo(() => {
        const expenseTxs = transactions.filter(tx => tx.type === 'expense').length;
        return expenseTxs >= 10;
    }, [transactions]);

    const handleIncomeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(incomeInput);
        if (!isNaN(amount) && amount > 0) {
            setBudgetIncome(amount);
        }
    };

    const handleMethodSelect = (method: BudgetMethod) => {
        generateBudgetFromMethod(method, t);
    }
    
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    if (budgetCreationState.isGenerating) {
        return (
            <motion.div 
              className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-center"
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
                <div className="flex flex-col items-center justify-center h-48">
                    <LoaderIcon className="w-8 h-8 mx-auto animate-spin text-purple-500" />
                    <p className="mt-4 text-zinc-500 dark:text-zinc-400">{t('budgetCreation.generatingBudget')}</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
          className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{t('budgetCreation.title')}</h3>
            
            {budgetCreationState.step === 'get_income' && (
                 <motion.div key="income" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <form onSubmit={handleIncomeSubmit}>
                        <label htmlFor="income" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t('budgetCreation.incomePrompt')}</label>
                        <div className="flex gap-2">
                             <input
                                type="number"
                                id="income"
                                value={incomeInput}
                                onChange={e => setIncomeInput(e.target.value)}
                                className="flex-grow bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder={t('budgetCreation.incomePlaceholder')}
                                autoFocus
                            />
                            <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-purple-700 transition-colors">
                                {t('budgetCreation.nextButton')}
                            </button>
                        </div>
                    </form>
                 </motion.div>
            )}

            {budgetCreationState.step === 'get_method' && budgetCreationState.income && (
                <motion.div key="method" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">{t('budgetCreation.methodBasedOnIncome', { income: formatter.format(budgetCreationState.income) })}</p>
                    <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-3">{t('budgetCreation.methodPrompt')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <button onClick={() => handleMethodSelect('50/30/20')} className="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700/80 transition-colors text-center">
                            <span className="text-xl font-bold text-purple-600 dark:text-purple-400">50/30/20</span>
                            <span className="text-xs block text-zinc-500 dark:text-zinc-400">{t('budgetCreation.method503020')}</span>
                        </button>
                        <button onClick={() => handleMethodSelect('60/30/10')} className="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700/80 transition-colors text-center">
                            <span className="text-xl font-bold text-orange-600 dark:text-orange-400">60/30/10</span>
                            <span className="text-xs block text-zinc-500 dark:text-zinc-400">{t('budgetCreation.method603010')}</span>
                        </button>
                         <button onClick={() => handleMethodSelect('80/20')} className="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700/80 transition-colors text-center">
                            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">80/20</span>
                            <span className="text-xs block text-zinc-500 dark:text-zinc-400">{t('budgetCreation.method8020')}</span>
                        </button>
                         <button onClick={() => handleMethodSelect('manual')} className="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700/80 transition-colors text-center">
                            <span className="text-xl font-bold text-green-600 dark:text-green-400">Manual</span>
                            <span className="text-xs block text-zinc-500 dark:text-zinc-400">{t('budgetCreation.methodManual')}</span>
                        </button>
                         <button 
                            onClick={() => handleMethodSelect('ai')} 
                            className="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700/80 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center md:col-span-2 lg:col-span-1"
                            disabled={!hasEnoughDataForAI}
                            title={!hasEnoughDataForAI ? t('insights.notEnoughData') : ''}
                          >
                            <div className="flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-cyan-500 dark:text-cyan-400"/>
                                <span className="text-xl font-bold text-cyan-600 dark:text-cyan-400">AI</span>
                            </div>
                            <span className="text-xs block text-zinc-500 dark:text-zinc-400">{t('budgetCreation.methodAi')}</span>
                        </button>
                    </div>
                </motion.div>
            )}

            <div className="mt-4 text-right">
                 <button onClick={cancelBudgetCreation} className="text-zinc-500 text-sm hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                    {t('budgetCreation.cancelButton')}
                </button>
            </div>
        </motion.div>
    );
};

export default BudgetCreationWidget;
