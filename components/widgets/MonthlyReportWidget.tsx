
import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { MonthlyReport } from '../../types';
import FileTextIcon from '../icons/FileTextIcon';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import { motion } from 'framer-motion';
import ArrowUpCircleIcon from '../icons/ArrowUpCircleIcon';
import ArrowDownCircleIcon from '../icons/ArrowDownCircleIcon';
import PiggyBankIcon from '../icons/PiggyBankIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';

const ReportCard: React.FC<{ report: MonthlyReport, onClick: () => void }> = ({ report, onClick }) => {
    const { t, locale, currency } = useLanguage();
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });

    return (
        <button onClick={onClick} className="w-full text-left bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors flex justify-between items-center group">
            <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {report.month} {report.year}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {t('reports.savingsRate')}: {Math.round(report.savingsRate)}%
                </p>
            </div>
            <div className="text-right">
                <span className={`font-mono font-bold ${report.netSavings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    {report.netSavings > 0 ? '+' : ''}{formatter.format(report.netSavings)}
                </span>
            </div>
        </button>
    );
};

const ReportDetail: React.FC<{ report: MonthlyReport, onBack: () => void }> = ({ report, onBack }) => {
    const { t, locale, currency } = useLanguage();
    const { categories } = useFinance();
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });

    const getCategoryName = (id: string) => {
        const cat = categories.find(c => c.id === id);
        return cat ? (cat.isCustom ? cat.name : t(cat.name)) : id;
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <button onClick={onBack} className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                    <ArrowLeftIcon className="w-5 h-5"/>
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{report.month} {report.year}</h2>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">{t('reports.generatedAt')} {new Date(report.generatedAt).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
                    <div className="flex items-center gap-2 mb-1 text-green-700 dark:text-green-400 text-xs font-bold uppercase">
                        <ArrowUpCircleIcon className="w-4 h-4"/> {t('sidebar.monthlyIncome')}
                    </div>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{formatter.format(report.totalIncome)}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                    <div className="flex items-center gap-2 mb-1 text-red-700 dark:text-red-400 text-xs font-bold uppercase">
                        <ArrowDownCircleIcon className="w-4 h-4"/> {t('sidebar.monthlyExpenses')}
                    </div>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{formatter.format(report.totalExpenses)}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-2 mb-1 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase">
                        <PiggyBankIcon className="w-4 h-4"/> {t('sidebar.netSavings')}
                    </div>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{formatter.format(report.netSavings)}</p>
                </div>
            </div>

            {/* Executive Summary */}
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-3">
                    {t('reports.executiveSummary')}
                </h3>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm">
                    {report.executiveSummary}
                </p>
            </div>

            {/* Breakdown Table */}
            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
                        <tr>
                            <th className="px-4 py-3">{t('tableBudget.category')}</th>
                            <th className="px-4 py-3 text-right">{t('tableBudget.planned')}</th>
                            <th className="px-4 py-3 text-right">{t('tableBudget.actual')}</th>
                            <th className="px-4 py-3 text-right">{t('tableBudget.differenceAmount', { currency: '' })}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900/50">
                        {report.breakdown.sort((a,b) => b.actual - a.actual).map((item) => (
                            <tr key={item.categoryId}>
                                <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200 capitalize">
                                    {getCategoryName(item.categoryId)}
                                    {item.status === 'over' && <span className="ml-2 text-red-500 text-[10px]">⚠</span>}
                                </td>
                                <td className="px-4 py-3 text-right text-zinc-500 dark:text-zinc-400">{formatter.format(item.planned)}</td>
                                <td className="px-4 py-3 text-right font-medium text-zinc-800 dark:text-zinc-200">{formatter.format(item.actual)}</td>
                                <td className={`px-4 py-3 text-right font-medium ${item.difference >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {item.difference > 0 ? '+' : ''}{formatter.format(item.difference)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Analysis & Coaching */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('reports.behavioralAnalysis')}</h3>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed border border-zinc-100 dark:border-zinc-800">
                        {report.behavioralAnalysis}
                    </div>
                </div>
                <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('reports.coachingTips')}</h3>
                    <ul className="space-y-2">
                        {report.coachingTips.map((tip, idx) => (
                            <li key={idx} className="flex gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/30">
                                <span className="text-purple-600 mt-0.5"><CheckCircleIcon className="w-4 h-4"/></span>
                                <span className="text-sm text-zinc-800 dark:text-zinc-200">{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </motion.div>
    );
};

const MonthlyReportWidget: React.FC = () => {
    const { monthlyReports, inspectedReportId, setInspectedReportId } = useFinance();
    const { t } = useLanguage();

    const activeReport = monthlyReports.find(r => r.id === inspectedReportId);

    return (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg min-h-[400px]">
            {activeReport ? (
                <ReportDetail report={activeReport} onBack={() => setInspectedReportId(null)} />
            ) : (
                <>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                        <FileTextIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        {t('reports.title')}
                    </h3>
                    
                    {monthlyReports.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm italic">{t('reports.empty')}</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">{t('reports.emptyHint')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {monthlyReports.map(report => (
                                <ReportCard key={report.id} report={report} onClick={() => setInspectedReportId(report.id)} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MonthlyReportWidget;
