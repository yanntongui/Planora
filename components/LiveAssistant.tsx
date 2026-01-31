
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import XIcon from './icons/XIcon';
import StopCircleIcon from './icons/StopCircleIcon';
import MicIcon from './icons/MicIcon';
import { motion, AnimatePresence } from 'framer-motion';

const LiveAssistant: React.FC = () => {
    const { isLiveAssistantOpen, setLiveAssistantOpen, addTransaction, balance, transactions, budgets } = useFinance();
    const { language, currency } = useLanguage();
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [volume, setVolume] = useState(0);

    // Audio Context Refs
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);

    // Session Ref to close connection properly
    const sessionRef = useRef<Promise<any> | null>(null);

    // Connection Abort Controller Logic
    const activeConnectionIdRef = useRef<string | null>(null);

    // Tools Definition
    const tools: FunctionDeclaration[] = [
        {
            name: 'addTransaction',
            description: 'Log a new financial transaction (expense or income).',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    amount: { type: Type.NUMBER, description: 'The amount of the transaction.' },
                    label: { type: Type.STRING, description: 'A short description of the transaction.' },
                    type: { type: Type.STRING, enum: ['expense', 'income'], description: 'Type of transaction.' },
                    category: { type: Type.STRING, description: 'Category ID (foodAndDining, transport, shopping, entertainment, billsAndUtilities, health, income, general).' },
                },
                required: ['amount', 'label', 'type', 'category'],
            },
        },
        {
            name: 'checkBalance',
            description: 'Get the current account balance.',
            parameters: { type: Type.OBJECT, properties: {} },
        },
        {
            name: 'getRecentTransactions',
            description: 'Get a list of the 5 most recent transactions.',
            parameters: { type: Type.OBJECT, properties: {} },
        },
        {
            name: 'getBudgetStatus',
            description: 'Get the current status of all budgets (limit vs spent).',
            parameters: { type: Type.OBJECT, properties: {} },
        }
    ];

    const connect = useCallback(async () => {
        const connectionId = crypto.randomUUID();
        activeConnectionIdRef.current = connectionId;

        let apiKey = '';
        try {
            apiKey = process.env.API_KEY || '';
        } catch (e) {
            console.error("Failed to access API KEY");
        }

        if (!apiKey) {
            setError("API Key missing.");
            return;
        }

        try {
            setIsConnected(true);
            setError(null);
            const ai = new GoogleGenAI({ apiKey, dangerouslyAllowBrowser: true });

            // Setup Audio
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const inputCtx = new AudioContextClass({ sampleRate: 16000 });
            const outputCtx = new AudioContextClass({ sampleRate: 24000 });

            // Ensure context is running
            if (inputCtx.state === 'suspended') {
                await inputCtx.resume();
            }
            if (outputCtx.state === 'suspended') {
                await outputCtx.resume();
            }

            // Check if cancelled during async ops
            if (activeConnectionIdRef.current !== connectionId) {
                inputCtx.close();
                outputCtx.close();
                return;
            }

            inputAudioContextRef.current = inputCtx;
            outputAudioContextRef.current = outputCtx;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Check cancellation again
            if (activeConnectionIdRef.current !== connectionId) {
                stream.getTracks().forEach(t => t.stop());
                inputCtx.close();
                outputCtx.close();
                return;
            }

            streamRef.current = stream;

            const sampleRate = inputCtx.sampleRate || 16000;
            console.log(`Audio Input Sample Rate: ${sampleRate}`);

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        if (activeConnectionIdRef.current !== connectionId) return;
                        console.log("Live session connected");

                        const source = inputCtx.createMediaStreamSource(stream);
                        sourceRef.current = source;

                        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                        processorRef.current = processor;

                        processor.onaudioprocess = (e) => {
                            if (activeConnectionIdRef.current !== connectionId) return;

                            const inputData = e.inputBuffer.getChannelData(0);

                            // Visualizer volume
                            let sum = 0;
                            for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                            const rms = Math.sqrt(sum / inputData.length);
                            setVolume(Math.min(rms * 5, 1));

                            // Convert to PCM16
                            const pcm16 = new Int16Array(inputData.length);
                            for (let i = 0; i < inputData.length; i++) {
                                const s = Math.max(-1, Math.min(1, inputData[i]));
                                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                            }

                            // Encode base64
                            const uint8 = new Uint8Array(pcm16.buffer);
                            let binary = '';
                            const len = uint8.byteLength;
                            for (let i = 0; i < len; i++) {
                                binary += String.fromCharCode(uint8[i]);
                            }
                            const base64 = btoa(binary);

                            sessionPromise.then(session => {
                                if (activeConnectionIdRef.current === connectionId) {
                                    session.sendRealtimeInput({
                                        media: {
                                            mimeType: `audio/pcm;rate=${sampleRate}`,
                                            data: base64
                                        }
                                    });
                                }
                            });
                        };

                        source.connect(processor);
                        processor.connect(inputCtx.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (activeConnectionIdRef.current !== connectionId) return;

                        // Audio Output
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            try {
                                const binary = atob(base64Audio);
                                const bytes = new Uint8Array(binary.length);
                                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

                                const int16 = new Int16Array(bytes.buffer);
                                const float32 = new Float32Array(int16.length);
                                for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0;

                                const buffer = outputCtx.createBuffer(1, float32.length, 24000);
                                buffer.getChannelData(0).set(float32);

                                const source = outputCtx.createBufferSource();
                                source.buffer = buffer;
                                source.connect(outputCtx.destination);

                                const currentTime = outputCtx.currentTime;
                                const startTime = Math.max(currentTime, nextStartTimeRef.current);
                                source.start(startTime);
                                nextStartTimeRef.current = startTime + buffer.duration;

                                audioQueueRef.current.push(source);
                                source.onended = () => {
                                    audioQueueRef.current = audioQueueRef.current.filter(s => s !== source);
                                };
                            } catch (e) {
                                console.error("Audio playback error", e);
                            }
                        }

                        // Function Calls
                        if (message.toolCall) {
                            for (const fc of message.toolCall.functionCalls) {
                                let result = {};
                                try {
                                    if (fc.name === 'addTransaction') {
                                        const { amount, label, type, category } = fc.args as any;
                                        addTransaction({ amount, label, type, category, date: new Date().toISOString() });
                                        result = { result: "Transaction added successfully." };
                                    } else if (fc.name === 'checkBalance') {
                                        result = { balance: balance, currency: currency };
                                    } else if (fc.name === 'getRecentTransactions') {
                                        result = { transactions: transactions.slice(0, 5).map(t => `${t.label}: ${t.amount}`) };
                                    } else if (fc.name === 'getBudgetStatus') {
                                        result = { budgets: budgets.map(b => `${b.name}: Spent ${b.currentSpent} of ${b.limit}`) };
                                    }
                                } catch (e) {
                                    console.error("Tool execution error", e);
                                    result = { error: "Failed to execute command" };
                                }

                                sessionPromise.then(session => {
                                    if (activeConnectionIdRef.current === connectionId) {
                                        session.sendToolResponse({
                                            functionResponses: {
                                                id: fc.id,
                                                name: fc.name,
                                                response: result
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    },
                    onclose: () => {
                        console.log("Session closed");
                        if (activeConnectionIdRef.current === connectionId) {
                            setIsConnected(false);
                        }
                    },
                    onerror: (e) => {
                        console.error("Live API Error", e);
                        if (activeConnectionIdRef.current === connectionId) {
                            setError("Connection error.");
                            setIsConnected(false);
                        }
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    tools: [{ functionDeclarations: tools }],
                    systemInstruction: `
You are Planora's benevolent Financial Coach (Voice Mode).
Language: ${language === 'fr' ? 'French' : 'English'}.
Currency: ${currency}.
Current Balance: ${balance}.

**ROLE:**
- You are a helpful, encouraging, and non-judgmental assistant.
- You help with quick tasks (adding expenses, checking status) and answering quick financial questions.

**BEHAVIOR:**
- **Tone**: Warm, concise, and reassuring.
- **NEVER** use words like "bad", "error", "wrong". Use "adjustment" or "update" instead.
- **Conciseness**: Spoken responses must be short. Don't give long lectures.
- **Privacy**: If asked about sensitive data not in context, say you can't access it.
- **Neutrality**: No investment advice.

**TASKS:**
- If user wants to add transaction: Confirm details briefly ("Added 25 for lunch").
- If user asks for advice: Give a very short, positive tip.
`
                }
            });
            sessionRef.current = sessionPromise;

        } catch (e) {
            if (activeConnectionIdRef.current === connectionId) {
                console.error(e);
                setError("Failed to initialize.");
                setIsConnected(false);
            }
        }
    }, [addTransaction, balance, currency, language, transactions, budgets]);

    const disconnect = useCallback(() => {
        activeConnectionIdRef.current = null; // Signal cancel

        try {
            // Close Audio Contexts
            if (inputAudioContextRef.current) {
                inputAudioContextRef.current.close().catch(() => { });
                inputAudioContextRef.current = null;
            }
            if (outputAudioContextRef.current) {
                outputAudioContextRef.current.close().catch(() => { });
                outputAudioContextRef.current = null;
            }

            // Stop Tracks
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }

            // Stop Processor
            if (processorRef.current) {
                processorRef.current.disconnect();
                processorRef.current = null;
            }
            if (sourceRef.current) {
                sourceRef.current.disconnect();
                sourceRef.current = null;
            }

            // Stop Session
            if (sessionRef.current) {
                sessionRef.current.then((s: any) => {
                    try { s.close(); } catch { }
                }).catch(() => { });
                sessionRef.current = null;
            }
        } catch (e) {
            console.error("Error during disconnect", e);
        } finally {
            // Force state reset
            setIsConnected(false);
            setLiveAssistantOpen(false);
        }
    }, [setLiveAssistantOpen]);

    useEffect(() => {
        if (isLiveAssistantOpen && !isConnected) {
            connect();
        } else if (!isLiveAssistantOpen && isConnected) {
            disconnect();
        }
        // Cleanup on unmount or when modal closes
        return () => {
            if (isConnected) disconnect();
        }
    }, [isLiveAssistantOpen]);

    if (!isLiveAssistantOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
        >
            <div className="relative w-full h-full max-w-md mx-auto flex flex-col items-center justify-center p-8">
                <button
                    onClick={disconnect}
                    className="absolute top-8 right-8 text-zinc-400 hover:text-white p-2 z-10"
                >
                    <XIcon className="w-8 h-8" />
                </button>

                <div className="text-center space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Gemini Live</h2>
                        <div className="flex items-center justify-center gap-3">
                            {isConnected && (
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                            )}
                            <p className="text-zinc-400 font-medium">
                                {isConnected
                                    ? (language === 'fr' ? "Je vous écoute..." : "Listening...")
                                    : (language === 'fr' ? "Connexion..." : "Connecting...")}
                            </p>
                        </div>
                    </div>

                    <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                        {/* Visualizer Orb */}
                        <motion.div
                            animate={{
                                scale: isConnected ? 1 + volume * 0.8 : 1,
                                opacity: isConnected ? 0.5 + volume * 0.5 : 0.3
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className={`absolute inset-0 rounded-full blur-xl ${isConnected ? 'bg-gradient-to-tr from-cyan-500 to-purple-600' : 'bg-zinc-700'}`}
                        />
                        <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center border border-zinc-800">
                            <MicIcon className={`w-8 h-8 ${isConnected ? 'text-white' : 'text-zinc-500'}`} />
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm bg-red-900/20 px-4 py-2 rounded-lg">{error}</p>
                    )}

                    <div className="flex justify-center">
                        <button
                            onClick={disconnect}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-3 rounded-full flex items-center gap-2 transition-colors font-medium z-10"
                        >
                            <StopCircleIcon className="w-5 h-5" />
                            {language === 'fr' ? "Terminer" : "End Session"}
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-12 left-0 right-0 text-center px-8">
                    <p className="text-zinc-500 text-xs">
                        Gemini Live can make mistakes. Please check important info.
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default LiveAssistant;
