
import React, { useState } from 'react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LoaderIcon from '../icons/LoaderIcon';
import SparklesIcon from '../icons/SparklesIcon';

interface SignupViewProps {
    onSwitch: () => void;
}

const SignupView: React.FC<SignupViewProps> = ({ onSwitch }) => {
  const { signup, isLoading, error } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && password) await signup(name, email, password);
  };

  return (
    <AuthLayout 
        title={t('auth.signupTitle')} 
        subtitle={t('auth.signupSubtitle')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                {error}
            </div>
        )}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">{t('auth.nameLabel')}</label>
          <input 
            type="text" 
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            placeholder={t('auth.demoUser')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">{t('auth.emailLabel')}</label>
          <input 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            placeholder={t('auth.demoEmail')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 uppercase tracking-wider">{t('auth.passwordLabel')}</label>
          <input 
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-6"
        >
          {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <>{t('auth.getStartedButton')} <SparklesIcon className="w-4 h-4" /></>}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-6">
        {t('auth.hasAccount')} {' '}
        <button onClick={onSwitch} className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
          {t('auth.signInLink')}
        </button>
      </p>
    </AuthLayout>
  );
};

export default SignupView;
