import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowRightIcon, LoaderIcon } from '../icons';
import AuthLayout from './AuthLayout';
import { useLanguage } from '../../context/LanguageContext';

interface LoginViewProps {
  onSwitch: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const { login, isLoading, error } = useAuth();
  const { t } = useLanguage();
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      await login(email);
      setIsSent(true);
    }
  };

  return (
    <AuthLayout
      title={t('auth.loginTitle')}
      subtitle={isSent ? 'Vérifiez votre email' : t('auth.loginSubtitle')}
    >
      {isSent ? (
        <div className="space-y-6">
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg text-green-800 dark:text-green-200 text-sm">
            Un lien de connexion a été envoyé à <strong>{email}</strong>. Cliquez dessus pour vous connecter.
          </div>
          <button
            onClick={() => setIsSent(false)}
            className="w-full text-purple-600 dark:text-purple-400 font-semibold text-sm hover:underline"
          >
            Renvoyer le lien ou changer d'email
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <>{t('auth.signInButton')} <ArrowRightIcon className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-6">
            {t('auth.noAccount')} {' '}
            <button onClick={onSwitch} className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
              {t('auth.createOne')}
            </button>
          </p>
        </>
      )}
    </AuthLayout>
  );
};

export default LoginView;
