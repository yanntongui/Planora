
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { parseCommand } from '../lib/parser';
import LoaderIcon from './icons/LoaderIcon';
import { Frequency, Budget } from '../types';
import { mapUserInputToCategoryId } from '../lib/rule-mapper';
import { suggestCategory } from '../lib/category-suggester';
import { Command, getCommands } from '../lib/commands';
import CommandSuggestions from './CommandSuggestions';
import { useToast } from '../context/ToastContext';
import { getCategoryIcon } from '../lib/category-helpers';
import PlusIcon from './icons/PlusIcon';
import CameraIcon from './icons/CameraIcon';
import XIcon from './icons/XIcon';
import { scanReceipt } from '../lib/receipt-scanner';

// Simple sound effect for success
const playSuccessSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(500, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
        // Ignore audio errors
    }
};

const QuickActions: React.FC<{ onAction: (text: string) => void }> = ({ onAction }) => {
    const { categories } = useFinance();
    const { t } = useLanguage();

    // Select a few key categories for quick access + actions
    const actions = [
        { label: 'Coffee', text: ' coffee', icon: getCategoryIcon('foodAndDining') },
        { label: 'Lunch', text: ' lunch', icon: getCategoryIcon('foodAndDining') },
        { label: 'Groceries', text: ' groceries', icon: getCategoryIcon('shopping') },
        { label: 'Income', text: '+ ', icon: PlusIcon, isIncome: true },
    ];

    return (
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1 justify-center">
            {actions.map((action) => (
                <button
                    key={action.label}
                    onClick={() => onAction(action.text)}
                    aria-label={t(`actions.${action.label.toLowerCase()}`, { defaultValue: `Quick action: ${action.label}` })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${action.isIncome ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}
                >
                    <action.icon className="w-3.5 h-3.5" />
                    {action.label}
                </button>
            ))}
        </div>
    );
};

// Helper to find budget allowing for slug matching (e.g. tag "BMW-E46" matches budget "BMW E46")
const findBudgetByTag = (budgets: Budget[], tag: string | undefined) => {
    if (!tag) return undefined;
    const search = tag.toLowerCase();
    return budgets.find(b => {
        const budgetName = b.name.toLowerCase();
        // 1. Exact match
        if (budgetName === search) return true;
        // 2. Slug match (Budget "BMW E46" matches tag "BMW-E46")
        if (budgetName.replace(/\s+/g, '-') === search) return true;
        return false;
    });
};

const CommandBar: React.FC = () => {
    const {
        commandInput: input, setCommandInput: setInput,
        addTransaction, addShoppingItem, createShoppingList, addBudget, addMonthlyBudget, addGoal,
        setActiveWidget, budgets, goals, addContributionToGoal, withdrawFromGoal,
        addRecurringTransaction, setPlannedIncome, addPlannedContribution,
        setBudgetingRule, addSubCategory, startBudgetCreation, budgetCreationState,
        addDebt, recordDebtPayment, aliases, addAlias,
        startSimulation, isSimulating, setHelpOpen
    } = useFinance();

    const [isParsing, setIsParsing] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [pendingReceipt, setPendingReceipt] = useState<string | null>(null);

    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [suggestions, setSuggestions] = useState<Command[]>([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const isInBudgetCreation = budgetCreationState.step !== 'idle';
    const commands = getCommands(t);

    const resetSuggestions = useCallback(() => {
        setSuggestions(commands.filter(c => c.isFeatured));
        setActiveSuggestionIndex(0);
    }, [commands]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (input) {
            const lowerInput = input.toLowerCase();
            const filtered = commands.filter(cmd =>
                cmd.name.toLowerCase().includes(lowerInput) ||
                cmd.keywords.some(kw => kw.toLowerCase().includes(lowerInput))
            );
            setSuggestions(filtered);
            setActiveSuggestionIndex(0);
            setShowSuggestions(true);
        } else {
            resetSuggestions();
            // Keep suggestions open on focus even if input is empty
        }
    }, [input, commands, resetSuggestions]);

    const getNextDueDate = (frequency: Frequency): string => {
        const now = new Date();
        switch (frequency) {
            case 'weekly': now.setDate(now.getDate() + 7); break;
            case 'monthly': now.setMonth(now.getMonth() + 1); break;
            case 'yearly': now.setFullYear(now.getFullYear() + 1); break;
        }
        return now.toISOString();
    }

    const handleCommandExecution = async (commandInput: string) => {
        if (!commandInput.trim() || isParsing || isInBudgetCreation) return;

        setIsParsing(true);
        setShowSuggestions(false);

        if (history[history.length - 1] !== commandInput) {
            setHistory(prev => [...prev, commandInput]);
        }
        setHistoryIndex(-1);

        // Check for aliases
        const lowerInput = commandInput.trim().toLowerCase();
        let finalInput = commandInput;
        if (aliases[lowerInput]) {
            finalInput = aliases[lowerInput];
        }

        const command = await parseCommand(finalInput, language);
        let success = false;

        // Special logic for START_SIMULATION
        if (command.action === 'START_SIMULATION') {
            if (!isSimulating) {
                startSimulation();
                showToast(t('simulation.started'));
                if (command.payload.command) {
                    setTimeout(() => handleCommandExecution(command.payload.command!), 100);
                }
            } else {
                showToast(t('simulation.alreadyActive'));
            }
            setIsParsing(false);
            setInput('');
            return;
        }

        switch (command.action) {
            case 'START_BUDGET_CREATION': startBudgetCreation(); success = true; break;
            case 'ADD_TRANSACTION': {
                const { label } = command.payload;
                let budgetName: string | undefined;

                // Regex to capture budget tag including Unicode characters (accents) and hyphens
                const budgetTagRegex = /#([\w\u00C0-\uFFFF-]+)/;
                const budgetMatch = label.match(budgetTagRegex);
                if (budgetMatch) budgetName = budgetMatch[1];

                // Improved matching: exact or slugified (e.g., #BMW-E46 matches "BMW E46")
                const budget = findBudgetByTag(budgets, budgetName);

                const finalLabel = label.replace(budgetTagRegex, '').trim();
                const category = command.payload.category || await suggestCategory(finalLabel);
                addTransaction({
                    ...command.payload,
                    date: command.payload.date || new Date().toISOString(),
                    label: finalLabel,
                    budgetId: budget?.id,
                    category: category,
                    receiptImage: pendingReceipt || undefined
                });
                success = true;
                break;
            }
            case 'CREATE_SHOPPING_LIST': createShoppingList(command.payload.name); success = true; break;
            case 'ADD_SHOPPING_ITEM': addShoppingItem(command.payload); success = true; break;
            case 'ADD_BUDGET': addBudget(command.payload); success = true; break;
            case 'ADD_MONTHLY_BUDGET': addMonthlyBudget(command.payload); success = true; break;
            case 'ADD_GOAL': addGoal(command.payload); success = true; break;
            case 'ADD_CONTRIBUTION': {
                const { amount, goalName } = command.payload;
                const goal = goals.find(g => g.name.toLowerCase() === goalName.toLowerCase());
                if (goal) {
                    addContributionToGoal(goal.id, amount);
                    success = true;
                }
                else console.warn(`Goal "${goalName}" not found.`);
                break;
            }
            case 'WITHDRAW_FROM_GOAL': {
                const { amount, goalName } = command.payload;
                const goal = goals.find(g => g.name.toLowerCase() === goalName.toLowerCase());
                if (goal) {
                    withdrawFromGoal(goal.id, amount);
                    success = true;
                }
                else console.warn(`Goal "${goalName}" not found.`);
                break;
            }
            case 'ADD_RECURRING_TRANSACTION': {
                const { label, amount, frequency, type } = command.payload;
                // Regex to capture budget tag including Unicode characters (accents) and hyphens
                const budgetTagRegex = /#([\w\u00C0-\uFFFF-]+)/;
                const budgetMatch = label.match(budgetTagRegex);
                const budgetName = budgetMatch ? budgetMatch[1] : undefined;

                // Improved matching
                const budget = findBudgetByTag(budgets, budgetName);

                const finalLabel = label.replace(budgetTagRegex, '').trim();
                const category = await suggestCategory(finalLabel);
                addRecurringTransaction({
                    label: finalLabel, amount, frequency, type,
                    nextDueDate: getNextDueDate(frequency),
                    category: category,
                    budgetId: budget?.id,
                });
                success = true;
                break;
            }
            case 'SET_PLANNED_INCOME': setPlannedIncome(command.payload.amount); success = true; break;
            case 'ADD_PLANNED_CONTRIBUTION': {
                const { amount, goalName } = command.payload;
                const goal = goals.find(g => g.name.toLowerCase() === goalName.toLowerCase());
                if (goal) {
                    addPlannedContribution(goal.id, amount);
                    success = true;
                }
                else console.warn(`Goal "${goalName}" not found.`);
                break;
            }
            case 'ADD_SUB_CATEGORY': {
                const { name, amount, category } = command.payload;
                const categoryId = mapUserInputToCategoryId(category);
                if (categoryId) {
                    addSubCategory({ name, plannedAmount: amount, categoryId });
                    success = true;
                } else {
                    console.warn(`Could not map category: ${category}`);
                }
                break;
            }
            case 'SET_BUDGETING_RULE': setBudgetingRule(command.payload); success = true; break;
            case 'ADD_DEBT': addDebt(command.payload); success = true; break;
            case 'RECORD_DEBT_PAYMENT': recordDebtPayment(command.payload.person, command.payload.amount, command.payload.type); success = true; break;
            case 'ADD_ALIAS':
                addAlias(command.payload.key, command.payload.command);
                showToast(t('settings.toast.aliasAdded', { key: command.payload.key }));
                success = true;
                break;
            case 'SHOW_WIDGET': setActiveWidget(command.payload.widget); success = true; break;
            case 'OPEN_HELP': setHelpOpen(true); success = true; break;
            case 'UNKNOWN': break;
        }

        if (success) {
            playSuccessSound();
            setPendingReceipt(null); // Clear attachment on success
        }

        setIsParsing(false);
        setInput('');
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleCommandExecution(input);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selectedSuggestion = suggestions[activeSuggestionIndex];
                if (selectedSuggestion) {
                    if (selectedSuggestion.isActionable) {
                        handleCommandExecution(selectedSuggestion.command);
                    } else {
                        setInput(selectedSuggestion.command);
                        setShowSuggestions(false);
                    }
                } else {
                    handleCommandExecution(input);
                }
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        } else if (input === '' && history.length > 0) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
                setHistoryIndex(newIndex);
                setInput(history[newIndex]);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex !== -1 && historyIndex < history.length - 1) {
                    const newIndex = historyIndex + 1;
                    setHistoryIndex(newIndex);
                    setInput(history[newIndex]);
                } else {
                    setHistoryIndex(-1);
                    setInput('');
                }
            }
        }
    };

    const handleSuggestionClick = (suggestion: Command) => {
        if (suggestion.isActionable) {
            handleCommandExecution(suggestion.command);
        } else {
            setInput(suggestion.command);
            inputRef.current?.focus();
        }
    }

    const handleQuickAction = (text: string) => {
        setInput(prev => prev + text);
        inputRef.current?.focus();
        if (text.startsWith(' ')) {
            requestAnimationFrame(() => {
                inputRef.current?.setSelectionRange(0, 0);
            });
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);

        // 1. Convert to base64 for storage
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            // Store just the base64 part for Gemini logic if needed, but for display we keep the data URI
            // For the Receipt Scanner helper, we pass the file directly.

            setPendingReceipt(base64String); // Save for later attachment

            // 2. Scan for text
            const result = await scanReceipt(file);
            setIsScanning(false);

            if (result) {
                setInput(result);
                inputRef.current?.focus();
                showToast(t('commandBar.receiptScanned'));
            } else {
                showToast(t('commandBar.receiptError'));
            }
        };
        reader.readAsDataURL(file);

        // Reset input
        e.target.value = '';
    }

    // Determine if we need to show a special overlay state
    const isSpecialState = isInBudgetCreation || isParsing || isScanning || (!input && !showSuggestions && !pendingReceipt);

    const renderHighlightedText = () => {
        if (isInBudgetCreation) return <span className="text-zinc-500 dark:text-zinc-500">{t('commandBar.budgetCreationMode')}</span>
        if (isParsing) return <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-2"><LoaderIcon className="w-4 h-4 animate-spin" /> {t('commandBar.parsing')}</span>
        if (isScanning) return <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-2"><LoaderIcon className="w-4 h-4 animate-spin" /> {t('commandBar.scanning')}</span>
        if (!input && !showSuggestions && !pendingReceipt) return <span className="text-zinc-400 dark:text-zinc-500">{t('commandBar.placeholder')} (<kbd className="font-sans text-xs bg-zinc-200 dark:bg-zinc-700 rounded p-0.5">⌘</kbd><kbd className="font-sans text-xs bg-zinc-200 dark:bg-zinc-700 rounded p-0.5">K</kbd>)</span>;
        return null;
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <form className="relative" onSubmit={handleSubmit} onFocus={() => { setShowSuggestions(true); resetSuggestions(); }} onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}>
                {/* Overlay for Placeholder / Special States */}
                <div className={`absolute inset-0 flex items-center justify-center px-12 pointer-events-none text-lg font-medium tracking-tight overflow-hidden whitespace-nowrap ${!isSpecialState ? 'hidden' : ''}`}>
                    {renderHighlightedText()}
                </div>

                {/* Camera Button / Attachment Preview */}
                {!isInBudgetCreation && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center gap-2">
                        {pendingReceipt && (
                            <div className="relative group">
                                <img src={pendingReceipt} alt="Receipt" className="w-8 h-8 rounded object-cover border border-zinc-300 dark:border-zinc-700" />
                                <button
                                    type="button"
                                    onClick={() => setPendingReceipt(null)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <XIcon className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                            disabled={isParsing || isScanning}
                            title="Scan Receipt"
                        >
                            <CameraIcon className="w-5 h-5" aria-hidden="true" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                        />
                    </div>
                )}

                {/* The Input Field */}
                <input
                    ref={inputRef} type="text" value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        setHistoryIndex(-1);
                    }}
                    onKeyDown={handleKeyDown}
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={showSuggestions}
                    aria-haspopup="listbox"
                    aria-controls="command-suggestions"
                    aria-label={t('commandBar.ariaLabel', { defaultValue: 'Recherche de commande financière' })}
                    className={`w-full bg-zinc-100 dark:bg-zinc-900/50 border text-center ${isSimulating ? 'border-cyan-500 ring-1 ring-cyan-500' : 'border-zinc-300 dark:border-zinc-700'} rounded-lg h-14 px-12 text-lg font-medium tracking-tight caret-zinc-900 dark:caret-zinc-100 focus:outline-none focus:ring-2 ${isSimulating ? 'focus:ring-cyan-500 focus:border-cyan-500' : 'focus:ring-purple-500 focus:border-purple-500'} disabled:opacity-50 ${isSpecialState ? 'text-transparent' : 'text-zinc-800 dark:text-zinc-200'}`}
                    autoFocus disabled={isParsing || isInBudgetCreation || isScanning}
                />
            </form>
            <CommandSuggestions
                isOpen={showSuggestions && !isInBudgetCreation}
                suggestions={suggestions}
                activeIndex={activeSuggestionIndex}
                onSelect={handleSuggestionClick}
            />
            {!isInBudgetCreation && <QuickActions onAction={handleQuickAction} />}
        </div>
    );
};

export default CommandBar;
