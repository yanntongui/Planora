
import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import EyeIcon from './icons/EyeIcon';
import EyeOffIcon from './icons/EyeOffIcon';

const BalanceDisplay: React.FC = () => {
  const { balance, currentConversation, isPrivacyMode, togglePrivacyMode } = useFinance();
  const { t, locale, currency } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  });

  return (
    <div className="text-center px-4 relative group">
      {currentConversation && (
          <div className="inline-block px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
              {currentConversation.name}
          </div>
      )}
      <div 
        className="relative inline-block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
          <h1 className={`text-5xl sm:text-7xl md:text-8xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter break-words leading-tight transition-all duration-300 ${isPrivacyMode ? 'blur-md select-none' : ''}`}>
            {formatter.format(balance)}
          </h1>
          
          <button 
            onClick={togglePrivacyMode}
            className={`absolute -right-8 top-1/2 -translate-y-1/2 p-2 rounded-full text-zinc-400 hover:text-purple-500 dark:hover:text-purple-400 transition-opacity ${isHovered || isPrivacyMode ? 'opacity-100' : 'opacity-0 md:opacity-0'}`}
            title={isPrivacyMode ? "Show Balance" : "Hide Balance"}
          >
              {isPrivacyMode ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>
      </div>
      <p className="text-zinc-500 dark:text-zinc-500 mt-2 text-sm sm:text-base">{t('balance.current')}</p>
    </div>
  );
};

export default BalanceDisplay;
