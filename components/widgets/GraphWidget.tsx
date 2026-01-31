
import React, { useState, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  AreaChart, Area, Legend
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import PieChartIcon from '../icons/PieChartIcon';
import BarChartIcon from '../icons/BarChartIcon';
import TrendingUpIcon from '../icons/TrendingUpIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction } from '../../types';

// Consistent Color Palette mapped to Category IDs
const CATEGORY_COLORS: Record<string, string> = {
  foodAndDining: '#F59E0B', // Amber 500
  transport: '#3B82F6', // Blue 500
  shopping: '#EC4899', // Pink 500
  entertainment: '#8B5CF6', // Purple 500
  billsAndUtilities: '#6366F1', // Indigo 500
  health: '#EF4444', // Red 500
  income: '#10B981', // Emerald 500 (Green)
  general: '#71717A', // Zinc 500 (Gray)
};

const FALLBACK_COLOR = '#A1A1AA'; // Zinc 400

type TimeRange = 'this_month' | 'last_30' | 'last_90' | 'year_to_date';
type ChartMode = 'breakdown' | 'cashflow' | 'trend';

const CustomTooltip: React.FC<any> = ({ active, payload, label, currency, locale }) => {
  if (active && payload && payload.length) {
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
    return (
      <div className="bg-white dark:bg-zinc-800 p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl text-sm">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2" style={{ color: entry.color || entry.fill }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></span>
            <span className="capitalize">{entry.name}:</span>
            <span className="font-bold font-mono">{formatter.format(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const GraphWidget: React.FC = () => {
  const { transactions, categories } = useFinance();
  const { t, locale, currency } = useLanguage();
  const { theme } = useTheme();
  
  const [timeRange, setTimeRange] = useState<TimeRange>('this_month');
  const [chartMode, setChartMode] = useState<ChartMode>('breakdown');

  // 1. Filter Transactions based on Time Range
  const filteredTransactions = useMemo((): Transaction[] => {
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last_30':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'last_90':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'year_to_date':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    // Set to start of day
    startDate.setHours(0,0,0,0);
    return transactions.filter(tx => new Date(tx.date) >= startDate);
  }, [transactions, timeRange]);

  // 2. Prepare Data for Pie Chart (Breakdown)
  const pieData = useMemo(() => {
    const expenses = filteredTransactions.filter(tx => tx.type === 'expense');
    const grouped = expenses.reduce((acc: Record<string, number>, tx) => {
      const catId = tx.category || 'general';
      acc[catId] = (acc[catId] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

    const total = (Object.values(grouped) as number[]).reduce((a, b) => a + b, 0);

    return Object.entries(grouped)
      .map(([catId, value]) => {
        const val = value as number;
        const cat = categories.find(c => c.id === catId);
        return {
          name: cat ? (cat.isCustom ? cat.name : t(cat.name)) : catId,
          value: val,
          percent: total > 0 ? (val / total) * 100 : 0,
          color: CATEGORY_COLORS[catId] || FALLBACK_COLOR
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories, t]);

  // 3. Prepare Data for Bar/Area Charts (Time Series)
  const timeSeriesData = useMemo(() => {
    const grouped: Record<string, { date: string; income: number; expense: number }> = {};
    const now = new Date();
    
    // Determine aggregation (Daily for < 90 days, Monthly for longer)
    const isMonthlyView = timeRange === 'year_to_date' && now.getMonth() > 2; // > March

    filteredTransactions.forEach(tx => {
      const d = new Date(tx.date);
      let key = '';
      let label = '';

      if (isMonthlyView) {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        label = d.toLocaleDateString(locale, { month: 'short' });
      } else {
        key = d.toISOString().split('T')[0];
        label = d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
      }

      if (!grouped[key]) grouped[key] = { date: label, income: 0, expense: 0 };
      
      if (tx.type === 'income') grouped[key].income += tx.amount;
      else grouped[key].expense += tx.amount;
    });

    // Sort by key (ISO date or YYYY-MM) to ensure chronological order
    return Object.keys(grouped).sort().map(key => grouped[key]);
  }, [filteredTransactions, timeRange, locale]);

  // Shared Chart Props
  const axisStyle = {
    fontSize: 10,
    stroke: theme === 'dark' ? '#71717a' : '#a1a1aa', // zinc-500/400
    tickLine: false,
    axisLine: false,
  };
  
  const gridStyle = {
      stroke: theme === 'dark' ? '#27272a' : '#e4e4e7', // zinc-800/200
      strokeDasharray: "3 3"
  }

  const renderContent = () => {
    if (filteredTransactions.length === 0) {
      return <div className="h-64 flex items-center justify-center text-zinc-400 dark:text-zinc-600 italic">{t('graph.empty')}</div>;
    }

    if (chartMode === 'breakdown') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke={theme === 'dark' ? '#18181b' : '#fff'} strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip currency={currency} locale={locale} />} />
            <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                iconType="circle"
                formatter={(value, entry: any) => (
                    <span className="text-xs text-zinc-600 dark:text-zinc-300 ml-1">{value} ({Math.round(entry.payload.percent)}%)</span>
                )}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartMode === 'cashflow') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid {...gridStyle} vertical={false} />
            <XAxis dataKey="date" {...axisStyle} dy={10} />
            <YAxis {...axisStyle} tickFormatter={(val) => new Intl.NumberFormat(locale, { notation: "compact" }).format(val)} />
            <Tooltip content={<CustomTooltip currency={currency} locale={locale} />} cursor={{fill: theme === 'dark' ? '#27272a' : '#f4f4f5'}} />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Bar name={t('history.typeIncome')} dataKey="income" fill={CATEGORY_COLORS.income} radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar name={t('history.typeExpense')} dataKey="expense" fill={CATEGORY_COLORS.health} radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartMode === 'trend') {
        return (
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CATEGORY_COLORS.entertainment} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={CATEGORY_COLORS.entertainment} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid {...gridStyle} vertical={false} />
                    <XAxis dataKey="date" {...axisStyle} dy={10} />
                    <YAxis {...axisStyle} tickFormatter={(val) => new Intl.NumberFormat(locale, { notation: "compact" }).format(val)} />
                    <Tooltip content={<CustomTooltip currency={currency} locale={locale} />} />
                    <Area type="monotone" name={t('history.typeExpense')} dataKey="expense" stroke={CATEGORY_COLORS.entertainment} strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
            </ResponsiveContainer>
        )
    }
  };

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            {chartMode === 'breakdown' && <PieChartIcon className="w-5 h-5 text-purple-500" />}
            {chartMode === 'cashflow' && <BarChartIcon className="w-5 h-5 text-emerald-500" />}
            {chartMode === 'trend' && <TrendingUpIcon className="w-5 h-5 text-blue-500" />}
            {t('graph.title')}
        </h3>

        <div className="flex items-center gap-2 bg-zinc-200 dark:bg-zinc-800 p-1 rounded-lg self-start sm:self-auto">
            <button onClick={() => setChartMode('breakdown')} className={`p-1.5 rounded-md transition-all ${chartMode === 'breakdown' ? 'bg-white dark:bg-zinc-700 shadow text-purple-600 dark:text-purple-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800'}`} title={t('graph.viewDistribution')}><PieChartIcon className="w-4 h-4"/></button>
            <button onClick={() => setChartMode('cashflow')} className={`p-1.5 rounded-md transition-all ${chartMode === 'cashflow' ? 'bg-white dark:bg-zinc-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800'}`} title="Cash Flow"><BarChartIcon className="w-4 h-4"/></button>
            <button onClick={() => setChartMode('trend')} className={`p-1.5 rounded-md transition-all ${chartMode === 'trend' ? 'bg-white dark:bg-zinc-700 shadow text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800'}`} title={t('graph.viewTrend')}><TrendingUpIcon className="w-4 h-4"/></button>
        </div>
      </div>

      {/* Time Filters */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-4 pb-1">
        {(['this_month', 'last_30', 'last_90', 'year_to_date'] as TimeRange[]).map((range) => (
            <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                    timeRange === range 
                    ? 'bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900' 
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
            >
                {t(`graph.timeFilter_${range}`)}
            </button>
        ))}
      </div>

      {/* Chart Container */}
      <AnimatePresence mode="wait">
        <motion.div
            key={chartMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full"
        >
            {renderContent()}
        </motion.div>
      </AnimatePresence>

    </div>
  );
};

export default GraphWidget;
