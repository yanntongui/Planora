import React, { useState } from 'react';
import { migrateToSupabase } from '../lib/migration';
import { useAuth } from '../context/AuthContext';
import { DatabaseIcon, LoaderIcon, CheckCircleIcon } from './icons';

interface MigrationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [isMigrating, setIsMigrating] = useState(false);
    const [progress, setProgress] = useState<string>('');
    const [isDone, setIsDone] = useState(false);

    if (!isOpen) return null;

    const handleMigration = async () => {
        if (!user) return;
        setIsMigrating(true);
        try {
            await migrateToSupabase(user.id, (msg) => setProgress(msg));
            setIsDone(true);
        } catch (e) {
            console.error(e);
            setProgress("Error during migration. Check console.");
        } finally {
            setIsMigrating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                        <DatabaseIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        Migration des données
                    </h3>
                </div>

                <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                    Transférez vos données locales vers le cloud sécurisé. Cela vous permettra d'accéder à vos comptes depuis n'importe quel appareil.
                </p>

                {progress && (
                    <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-sm font-mono text-zinc-600 dark:text-zinc-400">
                        {progress}
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    {!isDone ? (
                        <>
                            <button
                                onClick={onClose}
                                disabled={isMigrating}
                                className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleMigration}
                                disabled={isMigrating}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                {isMigrating && <LoaderIcon className="w-4 h-4 animate-spin" />}
                                {isMigrating ? 'Migration en cours...' : 'Démarrer la migration'}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <CheckCircleIcon className="w-4 h-4" /> Terminer
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
