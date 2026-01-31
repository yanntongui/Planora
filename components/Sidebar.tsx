
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { Conversation, Goal, ActiveWidget } from '../types';
import ChatPlusIcon from './icons/ChatPlusIcon';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';
import XIcon from './icons/XIcon';
import CheckIcon from './icons/CheckIcon';
import UserIcon from './icons/UserIcon';
import SettingsIcon from './icons/SettingsIcon';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowUpCircleIcon from './icons/ArrowUpCircleIcon';
import ArrowDownCircleIcon from './icons/ArrowDownCircleIcon';
import PiggyBankIcon from './icons/PiggyBankIcon';
import TargetIcon from './icons/TargetIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import HistoryIcon from './icons/HistoryIcon';
import ConfirmationModal from './ConfirmationModal';
import LayoutDashboardIcon from './icons/LayoutDashboardIcon';
import HelpCircleIcon from './icons/HelpCircleIcon';
import SearchIcon from './icons/SearchIcon';
import CopyIcon from './icons/CopyIcon';
import ArchiveIcon from './icons/ArchiveIcon';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import MenuIcon from './icons/MenuIcon';
import SparklesIcon from './icons/SparklesIcon';
import LoaderIcon from './icons/LoaderIcon';

// Reusing BriefcaseIcon as FolderIcon visually for budget context
import BriefcaseIcon from './icons/BriefcaseIcon';

const ConversationItem: React.FC<{ conversation: Conversation, onItemClick: () => void }> = ({ conversation, onItemClick }) => {
    const { activeConversationId, switchConversation, renameConversation, deleteConversation, duplicateConversation, archiveConversation, autoRenameConversation } = useFinance();
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(conversation.name);
    const [showMenu, setShowMenu] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const isActive = conversation.id === activeConversationId;
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    useEffect(() => {
        setName(conversation.name);
    }, [conversation.name]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRename = () => {
        if (name.trim() && name.trim() !== conversation.name) {
            renameConversation(conversation.id, name.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleRename();
        if (e.key === 'Escape') {
            setName(conversation.name);
            setIsEditing(false);
        }
    };

    const handleDeleteRequest = () => {
        setIsConfirmingDelete(true);
        setShowMenu(false);
    }

    const handleConfirmDelete = () => {
        deleteConversation(conversation.id);
    };

    const handleSmartRename = async () => {
        setShowMenu(false);
        setIsRenaming(true);
        const newName = await autoRenameConversation(conversation.id);
        setIsRenaming(false);
        if (newName) {
            showToast(t('sidebar.smartRenameSuccess', { name: newName }));
        } else {
            // Optional: toast error or just ignore
        }
    }

    return (
        <>
            <ConfirmationModal
                isOpen={isConfirmingDelete}
                onClose={() => setIsConfirmingDelete(false)}
                onConfirm={handleConfirmDelete}
                title={t('sidebar.deleteConversationTitle')}
                message={t('sidebar.deleteConversationMessage', { name: conversation.name })}
                confirmText={t('sidebar.confirmButton')}
                cancelText={t('sidebar.cancelButton')}
            />
            <motion.div
                layout
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`group flex items-center justify-between p-2 rounded-md cursor-pointer relative ${isActive ? 'bg-purple-100 dark:bg-purple-900/30' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
            >
                {/* Active Indicator */}
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-purple-600 rounded-r-full" />}

                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                ) : (
                    <div className="flex items-center gap-2 overflow-hidden flex-grow" onClick={() => { switchConversation(conversation.id); onItemClick(); }}>
                        {conversation.status === 'active' ? (
                            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" title={t('sidebar.active')} />
                        ) : (
                            <div className="w-2 h-2 rounded-full bg-zinc-400 flex-shrink-0" title={t('sidebar.archived')} />
                        )}
                        <span className={`truncate text-sm ${isActive ? 'font-medium text-purple-700 dark:text-purple-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
                            {conversation.name}
                        </span>
                        {isRenaming && <LoaderIcon className="w-3 h-3 animate-spin text-purple-500" />}
                    </div>
                )}

                <div className="flex items-center flex-shrink-0 ml-2" ref={menuRef}>
                    {isEditing ? (
                        <>
                            <button onClick={handleRename} className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"><CheckIcon className="w-4 h-4" /></button>
                            <button onClick={() => setIsEditing(false)} className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"><XIcon className="w-4 h-4" /></button>
                        </>
                    ) : (
                        <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className={`p-1 rounded-md ${showMenu ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}>
                                <MenuIcon className="w-4 h-4" />
                            </button>
                            <AnimatePresence>
                                {showMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                        className="absolute right-0 top-8 w-40 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 z-50 overflow-hidden"
                                    >
                                        <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                                            <EditIcon className="w-3 h-3" /> {t('sidebar.rename')}
                                        </button>
                                        <button onClick={handleSmartRename} className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
                                            <SparklesIcon className="w-3 h-3" /> {t('sidebar.smartRename')}
                                        </button>
                                        <button onClick={() => { duplicateConversation(conversation.id); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                                            <CopyIcon className="w-3 h-3" /> {t('sidebar.duplicate')}
                                        </button>
                                        <button onClick={() => { archiveConversation(conversation.id); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                                            <ArchiveIcon className="w-3 h-3" /> {conversation.status === 'archived' ? t('sidebar.unarchive') : t('sidebar.archive')}
                                        </button>
                                        <div className="border-t border-zinc-100 dark:border-zinc-700/50 my-1" />
                                        <button onClick={handleDeleteRequest} className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2">
                                            <TrashIcon className="w-3 h-3" /> {t('sidebar.delete')}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    );
};

const Dashboard: React.FC = () => {
    const { transactions } = useFinance();
    const { t, locale, currency } = useLanguage();
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency, notation: 'compact' });

    const { income, expenses, net } = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyTxs = transactions.filter(tx => new Date(tx.date) >= startOfMonth);

        const income = monthlyTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
        const expenses = monthlyTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);

        return { income, expenses, net: income - expenses };
    }, [transactions]);

    return (
        <div className="mb-4">
            <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">{t('sidebar.dashboard')}</h2>
            <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-md">
                    <ArrowUpCircleIcon className="w-5 h-5 text-green-500" />
                    <div className="text-sm">
                        <span className="text-zinc-500 dark:text-zinc-400">{t('sidebar.monthlyIncome')}</span>
                        <p className="font-bold text-zinc-800 dark:text-zinc-100">{formatter.format(income)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-md">
                    <ArrowDownCircleIcon className="w-5 h-5 text-red-500" />
                    <div className="text-sm">
                        <span className="text-zinc-500 dark:text-zinc-400">{t('sidebar.monthlyExpenses')}</span>
                        <p className="font-bold text-zinc-800 dark:text-zinc-100">{formatter.format(expenses)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-md">
                    <PiggyBankIcon className={`w-5 h-5 ${net >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
                    <div className="text-sm">
                        <span className="text-zinc-500 dark:text-zinc-400">{t('sidebar.netSavings')}</span>
                        <p className={`font-bold ${net >= 0 ? 'text-zinc-800 dark:text-zinc-100' : 'text-orange-500'}`}>{formatter.format(net)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GoalsPreview: React.FC = () => {
    const { goals } = useFinance();
    const { t } = useLanguage();

    const recentGoals = useMemo(() => {
        return goals
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 2);
    }, [goals]);

    if (recentGoals.length === 0) return null;

    return (
        <div className="my-4">
            <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TargetIcon className="w-3 h-3" />
                {t('sidebar.goalsPreview')}
            </h2>
            <div className="space-y-3">
                {recentGoals.map(goal => {
                    const progress = goal.target > 0 ? Math.min((goal.currentSaved / goal.target) * 100, 100) : 0;
                    return (
                        <div key={goal.id} className="text-sm">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate pr-2">{goal.name}</span>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const BudgetManager: React.FC<{ onItemClick: () => void }> = ({ onItemClick }) => {
    const { conversations } = useFinance();
    const { t } = useLanguage();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'active' | 'archived'>('active');

    const filteredConversations = useMemo(() => {
        return conversations
            .filter(c => {
                const status = c.status || 'active';
                return status === filterStatus;
            })
            .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [conversations, search, filterStatus]);

    return (
        <div className="my-4 flex flex-col h-full">
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="w-full flex justify-between items-center text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                <span className="flex items-center gap-1.5"><HistoryIcon className="w-3 h-3" /> {t('sidebar.budgets')}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
            </button>
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.div
                        className="flex flex-col gap-2"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        {/* Search & Filter */}
                        <div className="flex flex-col gap-2 mb-1">
                            <div className="relative">
                                <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t('sidebar.searchPlaceholder')}
                                    className="w-full bg-zinc-200 dark:bg-zinc-800 rounded px-2 pl-7 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 transition-shadow"
                                />
                            </div>
                            <div className="flex bg-zinc-200 dark:bg-zinc-800 rounded p-0.5">
                                <button
                                    onClick={() => setFilterStatus('active')}
                                    className={`flex-1 text-[10px] font-medium py-1 rounded transition-colors ${filterStatus === 'active' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500'}`}
                                >
                                    {t('sidebar.active')}
                                </button>
                                <button
                                    onClick={() => setFilterStatus('archived')}
                                    className={`flex-1 text-[10px] font-medium py-1 rounded transition-colors ${filterStatus === 'archived' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500'}`}
                                >
                                    {t('sidebar.archived')}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1 overflow-y-auto max-h-[300px] pr-1">
                            <AnimatePresence>
                                {filteredConversations.length > 0 ? (
                                    filteredConversations.map(conv => (
                                        <ConversationItem key={conv.id} conversation={conv} onItemClick={onItemClick} />
                                    ))
                                ) : (
                                    <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-2 italic">{t('history.noResults')}</p>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const BudgetSwitcher: React.FC<{ onCloseSidebar: () => void }> = ({ onCloseSidebar }) => {
    const { conversations, activeConversationId, switchConversation, createConversation } = useFinance();
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeConversations = conversations.filter(c => (c.status || 'active') === 'active');
    const currentConversation = conversations.find(c => c.id === activeConversationId);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative mb-6" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-6 h-6 rounded bg-purple-600 flex items-center justify-center text-white flex-shrink-0">
                        <BriefcaseIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {currentConversation?.name || "Select Budget"}
                    </span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 z-50 overflow-hidden"
                    >
                        <div className="max-h-60 overflow-y-auto">
                            {activeConversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => { switchConversation(conv.id); setIsOpen(false); onCloseSidebar(); }}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left ${conv.id === activeConversationId ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'text-zinc-700 dark:text-zinc-300'}`}
                                >
                                    <span className="truncate">{conv.name}</span>
                                    {conv.id === activeConversationId && <CheckIcon className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                        <div className="border-t border-zinc-200 dark:border-zinc-800 p-1">
                            <button
                                onClick={() => { createConversation(); setIsOpen(false); onCloseSidebar(); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-purple-600 dark:text-purple-400 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
                            >
                                <ChatPlusIcon className="w-4 h-4" />
                                {t('sidebar.newConversation')}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Sidebar: React.FC<{ closeSidebar?: () => void, openSettings: () => void }> = ({ closeSidebar = () => { }, openSettings }) => {
    const { userName, userAvatar, setActiveWidget, activeWidget, setHelpOpen } = useFinance();
    const { t } = useLanguage();
    const { theme, toggleTheme } = useTheme();

    const isDashboardActive = activeWidget === ActiveWidget.NONE;

    return (
        <aside className="w-64 bg-zinc-100/90 dark:bg-zinc-900/90 backdrop-blur-sm p-4 flex flex-col border-r border-zinc-200 dark:border-zinc-800 h-full">
            {/* New Budget Switcher Dropdown */}
            <BudgetSwitcher onCloseSidebar={closeSidebar} />

            <div className="mb-2">
                <button onClick={() => { setActiveWidget(ActiveWidget.NONE); closeSidebar(); }} className={`flex items-center gap-2 w-full p-2 rounded-md font-medium transition-colors text-sm ${isDashboardActive ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}>
                    <LayoutDashboardIcon className="w-4 h-4" />
                    {t('sidebar.dashboard')}
                </button>
            </div>

            <div className="flex-grow overflow-y-auto pr-1 -mr-1 flex flex-col">
                {!isDashboardActive && (
                    <>
                        <Dashboard />
                        <div className="border-t border-zinc-200 dark:border-zinc-700/50 my-2" />
                    </>
                )}
                <GoalsPreview />
                <div className="border-t border-zinc-200 dark:border-zinc-700/50 my-2" />
                <BudgetManager onItemClick={closeSidebar} />
            </div>

            <div className="mt-auto pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                    onClick={() => { setHelpOpen(true); closeSidebar(); }}
                    className="flex items-center gap-3 w-full p-2 mb-1 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700/50 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-sm font-medium"
                >
                    <HelpCircleIcon className="w-5 h-5" />
                    {t('sidebar.help')}
                </button>
                <button
                    onClick={() => toggleTheme()}
                    className="flex items-center gap-3 w-full p-2 mb-1 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700/50 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-sm font-medium"
                >
                    {theme === 'dark' ? (
                        <>
                            <SunIcon className="w-5 h-5" />
                            {t('theme.lightMode', { defaultValue: 'Mode Clair' })}
                        </>
                    ) : (
                        <>
                            <MoonIcon className="w-5 h-5" />
                            {t('theme.darkMode', { defaultValue: 'Mode Sombre' })}
                        </>
                    )}
                </button>
                <div
                    className="flex items-center justify-between gap-2 w-full p-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer"
                    onClick={() => { openSettings(); closeSidebar(); }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center text-lg">
                            {userAvatar}
                        </div>
                        <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 truncate">{userName}</span>
                    </div>
                    <button className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white rounded-md" aria-label={t('settings.title')}>
                        <SettingsIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
