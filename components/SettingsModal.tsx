
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Currency, Bucket, AiPersona } from '../types';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import XIcon from './icons/XIcon';
import ConfirmationModal from './ConfirmationModal';
import UploadIcon from './icons/UploadIcon';
import FileTextIcon from './icons/FileTextIcon';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';
import SparklesIcon from './icons/SparklesIcon';
import LockIcon from './icons/LockIcon';
import LogOutIcon from './icons/LogOutIcon';
import DatabaseIcon from './icons/DatabaseIcon';

type Tab = 'general' | 'profile' | 'data' | 'shortcuts' | 'categories';

const EMOJI_AVATARS = ['👤', '👩‍💼', '👨‍💼', '🧑‍💻', '🦄', '🦁', '🤖', '👽', '🦊', '🐱', '🐶', '🐼'];

const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { language, setLanguage, currency, setCurrency, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { userName, setUserName, userAvatar, setUserAvatar, aiPersona, setAiPersona, isPrivacyMode, togglePrivacyMode, exportData, exportCsv, importData, resetCurrentConversation, aliases, deleteAlias, categories, addCategory, deleteCategory } = useFinance();
  const { logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [nameInput, setNameInput] = useState(userName);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatBucket, setNewCatBucket] = useState<Bucket>('wants');

  useEffect(() => {
    setNameInput(userName);
  }, [userName, isOpen]);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    showToast(t('settings.toast.themeSet', { theme: t(`settings.${newTheme}`) }));
  };

  const handleLanguageChange = (lang: 'en' | 'fr') => {
    setLanguage(lang);
    showToast(t('settings.toast.languageSet', { language: lang.toUpperCase() }));
  };

  const handleCurrencyChange = (curr: Currency) => {
    setCurrency(curr);
    showToast(t('settings.toast.currencySet', { currency: curr }));
  };
  
  const handleNameSave = () => {
      if (nameInput.trim() && nameInput.trim() !== userName) {
          setUserName(nameInput.trim());
          showToast(t('settings.toast.userNameSet'));
      }
  };
  
  const handleExport = () => {
    exportData();
    showToast(t('settings.toast.dataExported'));
  }

  const handleExportCsv = () => {
    exportCsv();
    showToast(t('settings.toast.dataExported'));
  }

  const handleImportClick = () => {
      fileInputRef.current?.click();
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
              const success = importData(content);
              if (success) {
                  showToast(t('settings.toast.dataImported'));
                  onClose();
              } else {
                  showToast(t('settings.toast.importFailed'));
              }
          }
      };
      reader.readAsText(file);
      // Reset input so the same file can be selected again if needed
      e.target.value = '';
  }
  
  const handleReset = () => {
    resetCurrentConversation();
    setIsResetConfirmOpen(false);
    onClose();
    showToast(t('settings.toast.dataReset'));
  }
  
  const handleAddCategory = (e: React.FormEvent) => {
      e.preventDefault();
      if(newCatName.trim()) {
          addCategory({ name: newCatName.trim(), bucket: newCatBucket });
          setNewCatName('');
          setNewCatBucket('wants');
      }
  }
  
  const handleLogout = () => {
      logout();
      onClose();
  }

  const TabButton: React.FC<{ tab: Tab, children: React.ReactNode }> = ({ tab, children }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-purple-600 text-white' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
    >
      {children}
    </button>
  );

  return (
    <>
    <ConfirmationModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleReset}
        title={t('settings.resetConfirmationTitle')}
        message={t('settings.resetConfirmationMessage')}
        confirmText={t('settings.resetButton')}
        cancelText={t('sidebar.cancelButton')}
    />
    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t('settings.title')}</h2>
              <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"><XIcon className="w-5 h-5"/></button>
            </div>
            
            <div className="p-4">
                <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-6 overflow-x-auto no-scrollbar">
                    <TabButton tab="general">{t('settings.tabs.general')}</TabButton>
                    <TabButton tab="profile">{t('settings.tabs.profile')}</TabButton>
                    <TabButton tab="categories">{t('settings.tabs.categories')}</TabButton>
                    <TabButton tab="data">{t('settings.tabs.data')}</TabButton>
                    <TabButton tab="shortcuts">{t('settings.tabs.shortcuts')}</TabButton>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                    >
                        {activeTab === 'general' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('settings.theme')}</label>
                                    <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-md">
                                        <button onClick={() => handleThemeChange('light')} className={`w-full flex justify-center items-center gap-1.5 p-2 rounded text-sm transition-colors ${theme === 'light' ? 'bg-purple-500 text-white' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>
                                            <SunIcon className="w-4 h-4" /> {t('settings.light')}
                                        </button>
                                        <button onClick={() => handleThemeChange('dark')} className={`w-full flex justify-center items-center gap-1.5 p-2 rounded text-sm transition-colors ${theme === 'dark' ? 'bg-purple-600 text-white' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>
                                            <MoonIcon className="w-4 h-4" /> {t('settings.dark')}
                                        </button>
                                    </div>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('settings.language')}</label>
                                    <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-md">
                                        <button onClick={() => handleLanguageChange('en')} className={`w-full p-2 rounded text-sm transition-colors ${language === 'en' ? 'bg-purple-600 text-white' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>English</button>
                                        <button onClick={() => handleLanguageChange('fr')} className={`w-full p-2 rounded text-sm transition-colors ${language === 'fr' ? 'bg-purple-600 text-white' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>Français</button>
                                    </div>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('settings.currency')}</label>
                                    <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-md">
                                        {(['USD', 'EUR', 'XOF'] as Currency[]).map(c => (
                                            <button key={c} onClick={() => handleCurrencyChange(c)} className={`p-2 rounded text-sm transition-colors ${currency === c ? 'bg-purple-600 text-white' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>{c}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('settings.privacyMode')}</label>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('settings.privacyModeDesc')}</p>
                                        </div>
                                        <button 
                                            onClick={togglePrivacyMode}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${isPrivacyMode ? 'bg-purple-600' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPrivacyMode ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t('settings.avatar')}</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {EMOJI_AVATARS.map(avatar => (
                                            <button
                                                key={avatar}
                                                onClick={() => setUserAvatar(avatar)}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-transform hover:scale-110 ${userAvatar === avatar ? 'bg-purple-100 dark:bg-purple-900/50 ring-2 ring-purple-500' : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                                            >
                                                {avatar}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="userName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t('settings.userName')}</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            id="userName"
                                            value={nameInput}
                                            onChange={(e) => setNameInput(e.target.value)}
                                            onBlur={handleNameSave}
                                            onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                                            className="flex-grow bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder={t('settings.userNamePlaceholder')}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                                        <SparklesIcon className="w-4 h-4 text-purple-500"/> {t('settings.aiPersona')}
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {(['benevolent', 'strict', 'humorous'] as AiPersona[]).map(persona => (
                                            <button
                                                key={persona}
                                                onClick={() => setAiPersona(persona)}
                                                className={`p-3 rounded-lg text-left border transition-all ${aiPersona === persona 
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                                                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">{t(`settings.persona.${persona}`)}</span>
                                                    {aiPersona === persona && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                                                </div>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{t(`settings.personaDesc.${persona}`)}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-900/10 text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors font-medium text-sm"
                                    >
                                        <LogOutIcon className="w-4 h-4" />
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        )}
                        {activeTab === 'categories' && (
                            <div>
                                <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-2">{t('settings.categoriesTitle')}</h3>
                                <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                                    <input 
                                        type="text" 
                                        value={newCatName}
                                        onChange={e => setNewCatName(e.target.value)}
                                        placeholder={t('settings.categoryNamePlaceholder')}
                                        className="flex-grow bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                    <select 
                                        value={newCatBucket}
                                        onChange={e => setNewCatBucket(e.target.value as Bucket)}
                                        className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    >
                                        <option value="needs">{t('ruleBudget.needs')}</option>
                                        <option value="wants">{t('ruleBudget.wants')}</option>
                                        <option value="savings">{t('ruleBudget.savings')}</option>
                                    </select>
                                    <button type="submit" className="bg-purple-600 text-white p-2 rounded-md hover:bg-purple-700">
                                        <PlusIcon className="w-5 h-5"/>
                                    </button>
                                </form>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {categories.map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800 rounded-md">
                                            <div>
                                                <p className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{cat.isCustom ? cat.name : t(cat.name)}</p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{t(`ruleBudget.${cat.bucket}`)}</p>
                                            </div>
                                            {cat.isCustom && (
                                                <button onClick={() => deleteCategory(cat.id)} className="text-zinc-400 hover:text-red-500 p-1">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeTab === 'data' && (
                             <div className="space-y-6">
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg flex items-start gap-3">
                                    <DatabaseIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300">Local Storage Only</h4>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                            Your data is stored securely in this browser's memory. It is NOT synced to the cloud. Clearing your browser cache will remove your data. Use the Export button below to back it up.
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">{t('settings.dataManagement')}</h3>
                                    <div className="mt-3 grid gap-3">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('settings.exportDescription')}</p>
                                            <button onClick={handleExport} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                                                {t('settings.exportButton')}
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('settings.exportCsvDescription')}</p>
                                            <button onClick={handleExportCsv} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                                                <FileTextIcon className="w-4 h-4"/>
                                                {t('settings.exportCsvButton')}
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('settings.importDescription')}</p>
                                            <button onClick={handleImportClick} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold border-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                                <UploadIcon className="w-4 h-4"/>
                                                {t('settings.importButton')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border border-red-500/30 bg-red-500/10 rounded-lg">
                                    <h3 className="font-bold text-red-700 dark:text-red-400">{t('settings.dangerZone')}</h3>
                                     <p className="text-sm text-red-600 dark:text-red-300 mt-1">{t('settings.resetDescription')}</p>
                                     <button onClick={() => setIsResetConfirmOpen(true)} className="mt-3 px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">{t('settings.resetButton')}</button>
                                </div>
                             </div>
                        )}
                        {activeTab === 'shortcuts' && (
                            <div>
                                <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-2">{t('settings.shortcuts')}</h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">{t('settings.shortcutsDescription')}</p>
                                
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {Object.entries(aliases).length === 0 ? (
                                        <p className="text-sm text-zinc-400 dark:text-zinc-500 italic text-center py-4">{t('settings.noShortcuts')}</p>
                                    ) : (
                                        Object.entries(aliases).map(([key, command]) => (
                                            <div key={key} className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800 rounded-md">
                                                <div>
                                                    <p className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{key}</p>
                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{command}</p>
                                                </div>
                                                <button onClick={() => deleteAlias(key)} className="text-zinc-400 hover:text-red-500 p-1">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default SettingsModal;
