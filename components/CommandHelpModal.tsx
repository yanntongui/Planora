
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { getCommands, Command } from '../lib/commands';
import XIcon from './icons/XIcon';
import HelpCircleIcon from './icons/HelpCircleIcon';

interface CommandHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (cmd: string) => void;
}

const CommandHelpModal: React.FC<CommandHelpModalProps> = ({ isOpen, onClose, onExecute }) => {
  const { t } = useLanguage();
  const commands = getCommands(t);

  // Group commands for better readability
  const groupedCommands = {
    [t('help.category.transactions')]: commands.filter(c => ['addExpense', 'addIncome', 'showRecurring', 'showDebts'].some(key => c.name.includes(t(`commands.${key}.name`)))),
    [t('help.category.planning')]: commands.filter(c => ['showPlanning', 'startMonthlyBudget', 'createBudget', 'createGoal'].some(key => c.name.includes(t(`commands.${key}.name`)))),
    [t('help.category.view')]: commands.filter(c => ['showShopping', 'showBudgets', 'showGoals', 'showGraph', 'showInsights'].some(key => c.name.includes(t(`commands.${key}.name`)))),
  };

  // Remaining commands fall into "Other"
  const categorizedNames = Object.values(groupedCommands).flat().map(c => c.name);
  const otherCommands = commands.filter(c => !categorizedNames.includes(c.name));
  
  if(otherCommands.length > 0) {
      (groupedCommands as any)[t('help.category.other')] = otherCommands;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <HelpCircleIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t('help.title')}</h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('help.subtitle')}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <XIcon className="w-6 h-6"/>
                </button>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto p-6 bg-zinc-50/50 dark:bg-zinc-950/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(groupedCommands).map(([category, cmds]) => (
                        <div key={category} className="space-y-3">
                            <h3 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider pl-1">{category}</h3>
                            <div className="space-y-2">
                                {(cmds as Command[]).map((cmd) => (
                                    <button 
                                        key={cmd.name}
                                        onClick={() => { onExecute(cmd.command); onClose(); }}
                                        className="w-full text-left p-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                                                {cmd.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">{cmd.name}</h4>
                                                </div>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{cmd.description}</p>
                                                <div className="mt-2 inline-block px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-900/50 text-xs font-mono text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/50">
                                                    {cmd.command}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 text-center">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t('help.footerHint')}
                </p>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandHelpModal;
