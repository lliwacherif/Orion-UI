import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { chat } from '../api/orcha';
import AgentInput from './AgentInput';

const PlanWithAgent: React.FC = () => {
    const { language } = useLanguage();
    const { user } = useAuth();
    const { session } = useSession();

    const [plan, setPlan] = useState<string | null>(null);
    const [isPlanning, setIsPlanning] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<string | null>(null);

    const handlePlanRequest = async (prompt: string) => {
        if (!user || !session) return;

        setIsPlanning(true);
        setPlan(null);
        setExecutionResult(null);

        try {
            const systemPrompt = "Take this prompt and break it down into a structured execution plan with divided tasks. Return the plan to the user.";
            const fullPrompt = `${systemPrompt}\n\nUser Prompt: ${prompt}`;

            const response = await chat({
                user_id: user.id.toString(),
                tenant_id: session.tenant_id,
                message: fullPrompt,
                conversation_history: []
            });

            if (response.message) {
                setPlan(response.message);
            }
        } catch (error) {
            console.error('Planning failed:', error);
            // Handle error (maybe show a toast or error message)
        } finally {
            setIsPlanning(false);
        }
    };

    const handleExecutePlan = async () => {
        if (!user || !session || !plan) return;

        setIsExecuting(true);

        try {
            const systemPrompt = "Execute this plan.";
            const fullPrompt = `${systemPrompt}\n\nPlan:\n${plan}`;

            const response = await chat({
                user_id: user.id.toString(),
                tenant_id: session.tenant_id,
                message: fullPrompt,
                conversation_history: [] // You might want to pass history if context is needed
            });

            if (response.message) {
                setExecutionResult(response.message);
            }
        } catch (error) {
            console.error('Execution failed:', error);
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white/50 backdrop-blur-sm rounded-3xl border border-white/40 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/30 bg-white/40 backdrop-blur-md">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </span>
                    {language === 'en' ? 'Plan With Agent' : 'Planifier avec l\'Agent'}
                </h2>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Input Section */}
                {!plan && !isPlanning && (
                    <div className="flex flex-col gap-4">
                        <p className="text-gray-600 text-sm">
                            {language === 'en'
                                ? 'Describe your goal, and I will create a structured plan for you.'
                                : 'Décrivez votre objectif, et je créerai un plan structuré pour vous.'}
                        </p>
                        <AgentInput
                            onSend={handlePlanRequest}
                            placeholder={language === 'en' ? 'e.g., Create a marketing strategy for...' : 'ex., Créer une stratégie marketing pour...'}
                        />
                    </div>
                )}

                {/* Loading State - Planning */}
                {isPlanning && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-purple-700 font-medium animate-pulse">
                            {language === 'en' ? 'Creating your plan...' : 'Création de votre plan...'}
                        </p>
                    </div>
                )}

                {/* Plan Display */}
                {plan && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-white/60 rounded-2xl p-6 border border-white/50 shadow-sm">
                            <div className="prose prose-sm prose-purple max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {plan}
                                </ReactMarkdown>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleExecutePlan}
                                disabled={isExecuting}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isExecuting ? (
                                    <>
                                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        {language === 'en' ? 'Executing...' : 'Exécution...'}
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {language === 'en' ? 'Execute Plan' : 'Exécuter le Plan'}
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    setPlan(null);
                                    setExecutionResult(null);
                                }}
                                disabled={isExecuting}
                                className="px-4 py-3 bg-white/50 text-gray-600 rounded-xl font-medium hover:bg-white/80 transition border border-gray-200"
                            >
                                {language === 'en' ? 'Reset' : 'Réinitialiser'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Execution Result */}
                {executionResult && (
                    <div className="mt-6 pt-6 border-t border-gray-200/50 animate-fadeIn">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="text-green-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                            {language === 'en' ? 'Execution Result' : 'Résultat de l\'Exécution'}
                        </h3>
                        <div className="bg-green-50/50 rounded-2xl p-6 border border-green-100 shadow-sm">
                            <div className="prose prose-sm prose-green max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {executionResult}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlanWithAgent;
