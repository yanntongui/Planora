
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { ShoppingItem, ShoppingList } from '../../types';
import XIcon from '../icons/XIcon';
import PlusIcon from '../icons/PlusIcon';
import TrashIcon from '../icons/TrashIcon';
import EditIcon from '../icons/EditIcon';
import CheckIcon from '../icons/CheckIcon';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../ConfirmationModal';

const ShoppingListItem: React.FC<{ item: ShoppingItem; listId: string }> = ({ item, listId }) => {
  const { purchaseShoppingItem, deleteShoppingItem } = useFinance();
  const { t, locale, currency } = useLanguage();
  const [isConverting, setIsConverting] = useState(false);
  const [cost, setCost] = useState('');

  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });

  const handleCheck = () => setIsConverting(true);
  
  const handleCostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const costValue = parseFloat(cost);
    if (!isNaN(costValue) && costValue > 0) {
      purchaseShoppingItem(listId, item.id, costValue);
    }
  };

  if (item.status === 'purchased' && item.actualAmount !== undefined) {
    const difference = item.plannedAmount - item.actualAmount;
    const diffColor = difference > 0 ? 'text-green-500' : difference < 0 ? 'text-red-500' : 'text-zinc-500';
    
    return (
      <motion.li
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 opacity-60"
      >
        <div className="flex-grow">
          <p className="text-zinc-800 dark:text-zinc-200 line-through">{item.text}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t('shoppingList.planned')}: {formatter.format(item.plannedAmount)} | {t('shoppingList.actual')}: {formatter.format(item.actualAmount)}
          </p>
        </div>
        <div className="flex items-center gap-4 ml-4">
          <span className={`text-sm font-semibold ${diffColor}`}>
            {difference >= 0 ? '+' : ''}{formatter.format(difference)}
          </span>
           <button onClick={() => deleteShoppingItem(listId, item.id)} className="text-zinc-400 hover:text-red-500" aria-label={t('shoppingList.deleteItemAriaLabel')}>
                <XIcon className="w-4 h-4" />
            </button>
        </div>
      </motion.li>
    );
  }

  return (
    <motion.li 
        layout
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-900/50"
    >
      {!isConverting ? (
        <>
          <div className="flex items-center gap-3">
            <input 
              type="checkbox"
              id={`item-${item.id}`}
              className="w-5 h-5 bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 rounded text-purple-600 dark:text-purple-500 focus:ring-purple-500 dark:focus:ring-purple-600 cursor-pointer"
              onChange={handleCheck}
            />
            <label htmlFor={`item-${item.id}`} className="text-zinc-800 dark:text-zinc-200 cursor-pointer">{item.text}</label>
          </div>
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{formatter.format(item.plannedAmount)}</span>
        </>
      ) : (
        <form onSubmit={handleCostSubmit} className="w-full flex gap-2 items-center">
          <label className="flex-grow text-zinc-500 dark:text-zinc-400 italic">{t('shoppingList.itemCostLabel', { item: item.text })}</label>
          <input
            type="number"
            step="0.01"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-1 text-sm w-24 focus:outline-none focus:ring-1 focus:ring-purple-500"
            placeholder="e.g., 4.99"
            autoFocus
          />
          <button type="submit" className="bg-purple-600 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-purple-700">{t('shoppingList.addButton')}</button>
        </form>
      )}
    </motion.li>
  );
};

const ListManager: React.FC<{ activeList: ShoppingList | undefined }> = ({ activeList }) => {
    const { shoppingLists, createShoppingList, deleteShoppingList, renameShoppingList, setActiveShoppingListId } = useFinance();
    const { t } = useLanguage();
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(activeList?.name || '');
    const [isCreating, setIsCreating] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const createInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isCreating) {
            createInputRef.current?.focus();
        }
    }, [isCreating]);

    useEffect(() => {
        setNewName(activeList?.name || '');
    }, [activeList]);

    const handleConfirmDelete = () => {
        if (activeList) {
            deleteShoppingList(activeList.id);
        }
    };
    
    const handleRename = () => {
        if (activeList && newName.trim() && newName.trim() !== activeList.name) {
            renameShoppingList(activeList.id, newName.trim());
        }
        setIsRenaming(false);
    };
    
    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleRename();
        if (e.key === 'Escape') setIsRenaming(false);
    }

    const handleCreate = () => {
        if (newListName.trim()) {
            createShoppingList(newListName.trim());
            setNewListName('');
            setIsCreating(false);
        }
    };

    const handleCreateKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleCreate();
        if (e.key === 'Escape') {
            setNewListName('');
            setIsCreating(false);
        }
    };

    if (isCreating) {
        return (
            <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg w-full">
                <input
                    ref={createInputRef}
                    type="text"
                    value={newListName}
                    onChange={e => setNewListName(e.target.value)}
                    onKeyDown={handleCreateKeyDown}
                    placeholder={t('shoppingList.newListPlaceholder')}
                    className="flex-grow bg-zinc-200 dark:bg-zinc-700 rounded-md px-2 py-1.5 text-sm"
                />
                <div className="flex items-center gap-1">
                    <button onClick={() => { setNewListName(''); setIsCreating(false); }} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-red-500 rounded-md"><XIcon className="w-4 h-4"/></button>
                    <button onClick={handleCreate} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-green-500 rounded-md"><CheckIcon className="w-4 h-4"/></button>
                </div>
            </div>
        )
    }

    return (
        <>
            {activeList && (
                <ConfirmationModal
                    isOpen={isConfirmingDelete}
                    onClose={() => setIsConfirmingDelete(false)}
                    onConfirm={handleConfirmDelete}
                    title={t('shoppingList.deleteListTitle')}
                    message={t('shoppingList.deleteConfirmation', { name: activeList.name })}
                    confirmText={t('sidebar.confirmButton')}
                    cancelText={t('sidebar.cancelButton')}
                />
            )}
            <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
                <select
                    value={activeList?.id || ''}
                    onChange={(e) => setActiveShoppingListId(e.target.value)}
                    className="flex-grow bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                    {shoppingLists.map(list => (
                        <option key={list.id} value={list.id}>{list.name}</option>
                    ))}
                </select>
                {isRenaming && activeList ? (
                    <div className="flex items-center gap-1">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={handleRenameKeyDown}
                            onBlur={handleRename}
                            className="bg-zinc-200 dark:bg-zinc-700 rounded-md px-2 py-1 text-sm w-28"
                            autoFocus
                        />
                        <button onClick={handleRename} className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:text-green-500"><CheckIcon className="w-4 h-4"/></button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1">
                        {activeList && <button onClick={() => setIsRenaming(true)} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-blue-500 rounded-md"><EditIcon className="w-4 h-4"/></button>}
                        {activeList && <button onClick={() => setIsConfirmingDelete(true)} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-red-500 rounded-md"><TrashIcon className="w-4 h-4"/></button>}
                    </div>
                )}
                <button onClick={() => setIsCreating(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-semibold">
                    <PlusIcon className="w-4 h-4" />
                    {t('shoppingList.newListButton')}
                </button>
            </div>
        </>
    );
};

const AddItemForm: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
    const { addShoppingItem } = useFinance();
    const { t } = useLanguage();
    const [text, setText] = useState('');
    const [amount, setAmount] = useState('');
    const textInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        textInputRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const plannedAmount = parseFloat(amount);
        if (text.trim() && !isNaN(plannedAmount) && plannedAmount >= 0) {
            addShoppingItem({ text: text.trim(), plannedAmount });
            onCancel();
        }
    };

    return (
        <motion.div layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
            <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
                <input
                    ref={textInputRef}
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t('shoppingList.itemNamePlaceholder')}
                    className="flex-grow bg-zinc-200 dark:bg-zinc-700 rounded-md px-2 py-1.5 text-sm"
                />
                <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t('shoppingList.itemAmountPlaceholder')}
                    className="w-24 bg-zinc-200 dark:bg-zinc-700 rounded-md px-2 py-1.5 text-sm text-right"
                />
                <div className="flex items-center gap-1">
                    <button type="button" onClick={onCancel} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-red-500 rounded-md" aria-label={t('shoppingList.cancelButton')}><XIcon className="w-4 h-4"/></button>
                    <button type="submit" className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-green-500 rounded-md" aria-label={t('shoppingList.saveButton')}><CheckIcon className="w-5 h-5"/></button>
                </div>
            </form>
        </motion.div>
    );
};

const ShoppingListWidget: React.FC = () => {
  const { shoppingLists, activeShoppingListId, setActiveShoppingListId, createShoppingList, addShoppingItem } = useFinance();
  const { t, locale, currency } = useLanguage();
  const [isAddingItem, setIsAddingItem] = useState(false);

  useEffect(() => {
    if (!activeShoppingListId && shoppingLists.length > 0) {
        setActiveShoppingListId(shoppingLists[0].id);
    }
  }, [activeShoppingListId, shoppingLists, setActiveShoppingListId]);

  const activeList = useMemo(() => shoppingLists.find(l => l.id === activeShoppingListId), [shoppingLists, activeShoppingListId]);
  
  const { totalPlanned, totalActual, totalDifference } = useMemo(() => {
    if (!activeList) return { totalPlanned: 0, totalActual: 0, totalDifference: 0 };
    
    const totalPlanned = activeList.items.reduce((sum, item) => sum + item.plannedAmount, 0);
    const purchased = activeList.items.filter(i => i.status === 'purchased');
    const totalActual = purchased.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
    const plannedForPurchased = purchased.reduce((sum, item) => sum + item.plannedAmount, 0);

    return { totalPlanned, totalActual, totalDifference: plannedForPurchased - totalActual };
  }, [activeList]);

  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });

  const pendingItems = activeList?.items.filter(item => item.status === 'pending') || [];
  const purchasedItems = activeList?.items.filter(item => item.status === 'purchased') || [];
  
  const diffColor = totalDifference > 0 ? 'text-green-500 dark:text-green-400' : totalDifference < 0 ? 'text-red-500 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400';

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{t('shoppingList.title')}</h3>
      
      {shoppingLists.length > 0 && activeList ? (
        <>
          <ListManager activeList={activeList} />
          <div className="grid grid-cols-3 gap-2 text-center mb-4 text-sm">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('shoppingList.totalPlanned')}</p>
              <p className="font-bold text-zinc-800 dark:text-zinc-100">{formatter.format(totalPlanned)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('shoppingList.totalActual')}</p>
              <p className="font-bold text-zinc-800 dark:text-zinc-100">{formatter.format(totalActual)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('shoppingList.difference')}</p>
              <p className={`font-bold ${diffColor}`}>{totalDifference >= 0 ? '+' : ''}{formatter.format(totalDifference)}</p>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-zinc-500 dark:text-zinc-500 text-sm">{t('shoppingList.empty')}</p>
          <button onClick={() => createShoppingList("Shopping List")} className="mt-2 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">{t('shoppingList.createFirstList')}</button>
        </div>
      )}

      {activeList && (
        <div className="space-y-4">
            <div>
                <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">{t('shoppingList.toBuy')}</h4>
                {pendingItems.length > 0 && (
                    <ul className="space-y-2 mb-2">
                        <AnimatePresence>
                            {pendingItems.map(item => <ShoppingListItem key={item.id} item={item} listId={activeList.id} />)}
                        </AnimatePresence>
                    </ul>
                )}
                 <div>
                    {isAddingItem ? (
                        <AddItemForm onCancel={() => setIsAddingItem(false)} />
                    ) : (
                        <button 
                            onClick={() => setIsAddingItem(true)}
                            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-purple-600 dark:text-purple-400 font-semibold text-sm flex items-center gap-2"
                        >
                            <PlusIcon className="w-4 h-4" />
                            {t('shoppingList.addItemButton')}
                        </button>
                    )}
                </div>
            </div>

            {purchasedItems.length > 0 && (
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">{t('shoppingList.purchased')}</h4>
                    <ul className="space-y-2">
                         <AnimatePresence>
                            {purchasedItems.map(item => <ShoppingListItem key={item.id} item={item} listId={activeList.id} />)}
                        </AnimatePresence>
                    </ul>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ShoppingListWidget;
