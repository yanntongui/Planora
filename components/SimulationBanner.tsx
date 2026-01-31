
import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import SparklesIcon from './icons/SparklesIcon';
import CheckIcon from './icons/CheckIcon';
import XIcon from './icons/XIcon';

const SimulationBanner: React.FC = () => {
  const { isSimulating, commitSimulation, cancelSimulation } = useFinance();
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isSimulating && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-cyan-600 dark:bg-cyan-700 text-white shadow-lg"
        >
          <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 animate-pulse" />
              <div>
                <p className="font-bold text-sm">{t('simulation.bannerTitle')}</p>
                <p className="text-xs text-cyan-100 hidden sm:block">{t('simulation.bannerDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={cancelSimulation}
                className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-sm font-medium transition-colors"
              >
                <XIcon className="w-4 h-4" />
                {t('simulation.discard')}
              </button>
              <button
                onClick={commitSimulation}
                className="flex items-center gap-1 px-3 py-1 bg-white text-cyan-700 hover:bg-cyan-50 rounded-md text-sm font-bold transition-colors"
              >
                <CheckIcon className="w-4 h-4" />
                {t('simulation.apply')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SimulationBanner;
