
import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { RESOURCES, GLOSSARY, PATHS } from '../../lib/education-data';
import { EducationalResource } from '../../types';
import BookIcon from '../icons/BookIcon';
import GraduationCapIcon from '../icons/GraduationCapIcon';
import SparklesIcon from '../icons/SparklesIcon';
import SearchIcon from '../icons/SearchIcon';
import CheckIcon from '../icons/CheckIcon';
import ArrowRightIcon from '../icons/ArrowRightIcon';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';

// Types for internal state
type Tab = 'forYou' | 'library' | 'glossary';

const ResourceCard: React.FC<{ 
    resource: EducationalResource, 
    onClick: () => void, 
    isRead: boolean 
}> = ({ resource, onClick, isRead }) => {
    const { t } = useLanguage();
    
    return (
        <button 
            onClick={onClick}
            className={`w-full text-left p-4 rounded-xl border transition-all hover:shadow-md flex flex-col gap-2 group ${
                isRead 
                ? 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800' 
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700'
            }`}
        >
            <div className="flex justify-between items-start w-full">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    resource.level === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    resource.level === 'intermediate' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                }`}>
                    {resource.level}
                </span>
                {isRead && <CheckIcon className="w-4 h-4 text-green-500" />}
            </div>
            
            <h4 className={`font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors`}>
                {t(resource.titleKey)}
            </h4>
            
            <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                {t(resource.descriptionKey)}
            </p>
            
            <div className="mt-auto pt-2 text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                <BookIcon className="w-3 h-3" />
                {t('education.readTime', { min: resource.readTimeMinutes })}
            </div>
        </button>
    );
};

const ResourceDetail: React.FC<{ 
    resource: EducationalResource, 
    onBack: () => void 
}> = ({ resource, onBack }) => {
    const { t } = useLanguage();
    const { setCommandInput, markResourceRead, educationState } = useFinance();
    const isRead = educationState.readResourceIds.includes(resource.id);

    const handleAction = () => {
        if (resource.actionCommand) {
            setCommandInput(resource.actionCommand);
        }
    };

    const handleMarkRead = () => {
        markResourceRead(resource.id);
        onBack();
    }

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
        >
            <div className="flex items-center gap-4 mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div className="flex-grow">
                    <span className="text-xs uppercase text-zinc-500 font-bold">{resource.category}</span>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t(resource.titleKey)}</h2>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 prose dark:prose-invert max-w-none text-sm">
                <ReactMarkdown>{t(resource.contentKey)}</ReactMarkdown>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
                {resource.actionCommand && (
                    <button 
                        onClick={handleAction}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                        <SparklesIcon className="w-4 h-4" />
                        {t('education.takeAction')}
                    </button>
                )}
                {!isRead && (
                    <button 
                        onClick={handleMarkRead}
                        className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors"
                    >
                        {t('education.markAsRead')}
                    </button>
                )}
            </div>
        </motion.div>
    );
}

const EducationWidget: React.FC = () => {
    const { t } = useLanguage();
    const { debts, goals, transactions, educationState, userProfile } = useFinance(); // Use userProfile here
    const [activeTab, setActiveTab] = useState<Tab>('forYou');
    const [selectedResource, setSelectedResource] = useState<EducationalResource | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Contextual Recommendations based on Profile Intelligence
    const recommendations = useMemo(() => {
        let recs: EducationalResource[] = [];
        
        const eduLevel = userProfile.inferred.educationalLevel || 'beginner';
        const stress = userProfile.inferred.stressLevel;

        // 1. Profile Level Match
        recs.push(...RESOURCES.filter(r => r.level === eduLevel));

        // 2. Stress Based
        if (stress === 'high' || debts.length > 0) {
            recs.unshift(...RESOURCES.filter(r => r.category === 'debt'));
        }
        
        // 3. Goal Based
        if (goals.length > 0) {
            recs.push(...RESOURCES.filter(r => r.category === 'saving'));
        }
        
        // 4. Fallback: Psychology
        if (recs.length < 3) {
            recs.push(...RESOURCES.filter(r => r.category === 'psychology'));
        }

        // Deduplicate and prioritize unread
        const uniqueRecs = Array.from(new Set(recs));
        const unreadRecs = uniqueRecs.filter(r => !educationState.readResourceIds.includes(r.id));
        const readRecs = uniqueRecs.filter(r => educationState.readResourceIds.includes(r.id));
        
        return [...unreadRecs, ...readRecs].slice(0, 3);
    }, [debts, goals, transactions, userProfile, educationState.readResourceIds]);

    const filteredResources = useMemo(() => {
        if (!searchTerm) return RESOURCES;
        return RESOURCES.filter(r => 
            t(r.titleKey).toLowerCase().includes(searchTerm.toLowerCase()) ||
            t(r.descriptionKey).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, t]);

    const filteredGlossary = useMemo(() => {
        if (!searchTerm) return GLOSSARY;
        return GLOSSARY.filter(g => 
            t(g.termKey).toLowerCase().includes(searchTerm.toLowerCase()) ||
            t(g.definitionKey).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, t]);

    if (selectedResource) {
        return (
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg h-[600px] flex flex-col">
                <ResourceDetail resource={selectedResource} onBack={() => setSelectedResource(null)} />
            </div>
        );
    }

    return (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <GraduationCapIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    {t('education.title')}
                </h3>
            </div>

            <div className="flex gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-800">
                <button 
                    onClick={() => setActiveTab('forYou')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'forYou' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'}`}
                >
                    {t('education.tabForYou')}
                </button>
                <button 
                    onClick={() => setActiveTab('library')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'library' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'}`}
                >
                    {t('education.tabLibrary')}
                </button>
                <button 
                    onClick={() => setActiveTab('glossary')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'glossary' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'}`}
                >
                    {t('education.tabGlossary')}
                </button>
            </div>

            <div className="flex-grow overflow-y-auto pr-1">
                {activeTab === 'forYou' && (
                    <div className="space-y-6">
                        <section>
                            <h4 className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-2">
                                <SparklesIcon className="w-3 h-3 text-yellow-500" />
                                {t('education.recommended')}
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                                {recommendations.map(r => (
                                    <ResourceCard 
                                        key={r.id} 
                                        resource={r} 
                                        onClick={() => setSelectedResource(r)}
                                        isRead={educationState.readResourceIds.includes(r.id)}
                                    />
                                ))}
                            </div>
                        </section>

                        <section>
                            <h4 className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-2">
                                <ArrowRightIcon className="w-3 h-3" />
                                {t('education.paths')}
                            </h4>
                            <div className="space-y-3">
                                {PATHS.map(path => {
                                    const total = path.resources.length;
                                    const completed = path.resources.filter(id => educationState.readResourceIds.includes(id)).length;
                                    const progress = Math.round((completed / total) * 100);
                                    
                                    return (
                                        <div key={path.id} className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                                            <div className="flex justify-between items-center mb-2">
                                                <h5 className="font-bold text-zinc-900 dark:text-zinc-100">{t(path.titleKey)}</h5>
                                                <span className="text-xs font-mono text-zinc-500">{progress}%</span>
                                            </div>
                                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 mb-3">
                                                <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                                            </div>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">{t(path.descKey)}</p>
                                            <button 
                                                onClick={() => {
                                                    const nextId = path.resources.find(id => !educationState.readResourceIds.includes(id)) || path.resources[0];
                                                    const res = RESOURCES.find(r => r.id === nextId);
                                                    if(res) setSelectedResource(res);
                                                }}
                                                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                                            >
                                                {progress === 100 ? 'Review Path' : 'Continue Path'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'library' && (
                    <div className="space-y-4">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder={t('education.search')}
                                className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {filteredResources.map(r => (
                                <ResourceCard 
                                    key={r.id} 
                                    resource={r} 
                                    onClick={() => setSelectedResource(r)}
                                    isRead={educationState.readResourceIds.includes(r.id)}
                                />
                            ))}
                            {filteredResources.length === 0 && (
                                <p className="text-center text-sm text-zinc-500 py-8">{t('education.noResults')}</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'glossary' && (
                    <div className="space-y-4">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder={t('education.search')}
                                className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                        </div>
                        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {filteredGlossary.map((term, idx) => (
                                <div key={idx} className="py-3">
                                    <h5 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-1">{t(term.termKey)}</h5>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{t(term.definitionKey)}</p>
                                </div>
                            ))}
                             {filteredGlossary.length === 0 && (
                                <p className="text-center text-sm text-zinc-500 py-8">{t('education.noResults')}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EducationWidget;
