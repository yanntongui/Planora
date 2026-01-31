
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SparklesIcon from '../icons/SparklesIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import LockIcon from '../icons/LockIcon';
import MicIcon from '../icons/MicIcon';
import PieChartIcon from '../icons/PieChartIcon';
import PlusIcon from '../icons/PlusIcon';
import { useLanguage } from '../../context/LanguageContext';

interface LandingPageProps {
    onLogin: () => void;
    onSignup: () => void;
}

const DemoCommandBar = () => {
    const { language } = useLanguage();
    const [index, setIndex] = useState(0);
    const [subIndex, setSubIndex] = useState(0);
    const [blink, setBlink] = useState(true);
    const [reverse, setReverse] = useState(false);

    // Define localized examples
    const examples = useMemo(() => {
        const isFr = language === 'fr';
        return [
            {
                text: isFr ? "25 café #Alimentation" : "25 coffee #Food",
                type: isFr ? "Dépense" : "Expense",
                category: isFr ? "Alimentation" : "Food & Dining",
                typeColor: "bg-zinc-800 text-zinc-400",
                catColor: "bg-purple-900/30 text-purple-400"
            },
            {
                text: isFr ? "+ 2500 Salaire" : "+ 2500 Salary",
                type: isFr ? "Revenu" : "Income",
                category: isFr ? "Général" : "General",
                typeColor: "bg-green-900/30 text-green-400",
                catColor: "bg-zinc-800 text-zinc-400"
            },
            {
                text: isFr ? "budget Vacances 1500" : "budget Vacation 1500",
                type: "Budget",
                category: isFr ? "Événement" : "Event",
                typeColor: "bg-blue-900/30 text-blue-400",
                catColor: "bg-zinc-800 text-zinc-400"
            },
            {
                text: isFr ? "graphique" : "show graph",
                type: "Widget",
                category: isFr ? "Analytique" : "Analytics",
                typeColor: "bg-orange-900/30 text-orange-400",
                catColor: "bg-zinc-800 text-zinc-400"
            }
        ];
    }, [language]);

    // Typing effect logic
    useEffect(() => {
        if (subIndex === examples[index].text.length + 1 && !reverse) {
            // Finished typing word, wait before deleting
            const timeout = setTimeout(() => setReverse(true), 2000);
            return () => clearTimeout(timeout);
        }

        if (subIndex === 0 && reverse) {
            // Finished deleting, switch to next word
            setReverse(false);
            setIndex((prev) => (prev + 1) % examples.length);
            return;
        }

        const timeout = setTimeout(() => {
            setSubIndex((prev) => prev + (reverse ? -1 : 1));
        }, reverse ? 50 : 100 + Math.random() * 50); // Randomize typing speed slightly for realism

        return () => clearTimeout(timeout);
    }, [subIndex, index, reverse, examples]);

    // Cursor blinking effect
    useEffect(() => {
        const timeout2 = setInterval(() => {
            setBlink((prev) => !prev);
        }, 500);
        return () => clearInterval(timeout2);
    }, []);

    const currentExample = examples[index];
    const currentText = currentExample.text.substring(0, subIndex);

    return (
        <div className="w-full max-w-lg mx-auto bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-xl p-2 shadow-2xl relative overflow-hidden">
            {/* Input Area */}
            <div className="flex items-center px-4 py-3 bg-zinc-950/50 rounded-lg border border-zinc-800 h-[52px]">
                <span className="text-zinc-500 mr-3 shrink-0">$</span>
                <span className="text-zinc-100 font-mono text-lg whitespace-nowrap overflow-hidden">
                    {currentText}
                </span>
                <span className={`w-2 h-5 bg-purple-500 ml-1 ${blink ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}/>
            </div>

            {/* Smart Tags Area */}
            <div className="mt-2 flex gap-2 px-2 pb-1 h-6">
                <AnimatePresence mode="wait">
                    {subIndex > 2 && ( // Only show tags after a few chars are typed
                        <motion.div 
                            key={currentExample.text + "tags"}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex gap-2"
                        >
                            <div className={`rounded px-2 py-1 text-xs font-medium ${currentExample.typeColor}`}>
                                {currentExample.type}
                            </div>
                            <div className={`rounded px-2 py-1 text-xs font-medium ${currentExample.catColor}`}>
                                {currentExample.category}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; delay?: number }> = ({ icon, title, description, delay = 0 }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        viewport={{ once: true }}
        className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500/50 transition-colors"
    >
        <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-900 dark:text-zinc-100">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">{title}</h3>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onSignup }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white overflow-x-hidden selection:bg-purple-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="font-black text-white text-xs">P</span>
            </div>
            <span className="font-bold tracking-tight">Planora</span>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={onLogin} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">{t('auth.signInButton')}</button>
            <button onClick={onSignup} className="text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">{t('auth.signUpButton')}</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <span className="inline-block py-1 px-3 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold uppercase tracking-wider mb-6 border border-purple-500/20">
                    {t('landing.badge')}
                </span>
                <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">
                    {t('landing.heroTitle')}
                </h1>
                <p className="text-xl text-zinc-500 dark:text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                    {t('landing.heroSubtitle')}
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                    <button onClick={onSignup} className="w-full sm:w-auto h-12 px-8 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                        {t('landing.getStarted')} <ChevronRightIcon className="w-4 h-4" />
                    </button>
                    <button onClick={onLogin} className="w-full sm:w-auto h-12 px-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                        {t('landing.liveDemo')}
                    </button>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
            >
                <DemoCommandBar />
            </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold tracking-tight mb-4">{t('landing.featuresTitle')}</h2>
                  <p className="text-zinc-500 dark:text-zinc-400">{t('landing.featuresSubtitle')}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FeatureCard 
                    icon={<SparklesIcon className="w-6 h-6" />}
                    title={t('features.aiParserTitle')}
                    description={t('features.aiParserDesc')}
                    delay={0.1}
                  />
                  <FeatureCard 
                    icon={<PieChartIcon className="w-6 h-6" />}
                    title={t('features.analyticsTitle')}
                    description={t('features.analyticsDesc')}
                    delay={0.2}
                  />
                  <FeatureCard 
                    icon={<MicIcon className="w-6 h-6" />}
                    title={t('features.voiceTitle')}
                    description={t('features.voiceDesc')}
                    delay={0.3}
                  />
                  <FeatureCard 
                    icon={<LockIcon className="w-6 h-6" />}
                    title={t('features.privacyTitle')}
                    description={t('features.privacyDesc')}
                    delay={0.4}
                  />
                  <FeatureCard 
                    icon={<PlusIcon className="w-6 h-6" />}
                    title={t('features.budgetingTitle')}
                    description={t('features.budgetingDesc')}
                    delay={0.5}
                  />
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white flex flex-col justify-center items-center text-center">
                        <h3 className="text-2xl font-bold mb-2">{t('landing.readyTitle')}</h3>
                        <button onClick={onSignup} className="mt-4 px-6 py-2 bg-white text-purple-600 rounded-full font-bold hover:bg-zinc-100 transition-colors">
                            {t('landing.joinNow')}
                        </button>
                  </div>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-zinc-500 text-sm">{t('landing.footer', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
};

export default LandingPage;
