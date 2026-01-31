
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command } from '../lib/commands';

interface CommandSuggestionsProps {
  isOpen: boolean;
  suggestions: Command[];
  activeIndex: number;
  onSelect: (suggestion: Command) => void;
}

const CommandSuggestions: React.FC<CommandSuggestionsProps> = ({ isOpen, suggestions, activeIndex, onSelect }) => {
  const activeItemRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({
      block: 'nearest',
    });
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {isOpen && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 10 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute top-full left-0 w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-lg mt-2 overflow-hidden z-10"
        >
          <ul className="max-h-80 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.name}
                ref={index === activeIndex ? activeItemRef : null}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent input from losing focus
                  onSelect(suggestion);
                }}
                className={`flex items-center gap-4 px-4 py-3 cursor-pointer ${
                  index === activeIndex ? 'bg-purple-100 dark:bg-purple-900/50' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                  {suggestion.icon}
                </div>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{suggestion.name}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{suggestion.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandSuggestions;
