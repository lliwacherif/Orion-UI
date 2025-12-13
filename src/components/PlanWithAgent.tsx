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
        <div className="flex flex-col h-full bg-white rounded-3xl border border-blue-100 shadow-xl shadow-blue-900/5 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        {language === 'en' ? 'Planner' : 'Planificateur'}
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold uppercase tracking-wider">
                            Beta
                        </span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                        {language === 'en' ? 'AI-powered workflow generator' : 'Générateur de flux de travail IA'}
                    </p>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/50">
                {/* Input Section */}
                {!plan && !isPlanning && (
                    <div className="flex flex-col gap-6 h-full justify-center max-w-lg mx-auto">
                        <div className="text-center space-y-3">
                            <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-purple-500/30 transform -rotate-6">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">
                                {language === 'en' ? 'What can I help you plan?' : 'Que puis-je planifier pour vous ?'}
                            </h3>
                            <p className="text-gray-500 text-sm max-w-xs mx-auto">
                                {language === 'en'
                                    ? 'Describe your goal, and I will create a structured, step-by-step plan for you to execute.'
                                    : 'Décrivez votre objectif, et je créerai un plan structuré étape par étape pour que vous l\'exécutiez.'}
                            </p>
                        </div>

                        <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-100 transform transition-all hover:scale-[1.02] focus-within:scale-[1.02] focus-within:ring-2 ring-purple-500/20">
                            <AgentInput
                                onSend={handlePlanRequest}
                                placeholder={language === 'en' ? 'e.g., Create a launch strategy for my new product...' : 'ex., Créer une stratégie de lancement pour mon nouveau produit...'}
                            />
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center">
                            {['Marketing Strategy', 'Code Refactor', 'Content Calendar', 'System Design'].map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => handlePlanRequest(tag)}
                                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loading State - Planning */}
                {isPlanning && (
                    <div className="flex flex-col items-center justify-center py-20 h-full">
                        <div className="relative w-20 h-20 mb-6">
                            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-t-purple-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl">✨</span>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                            {language === 'en' ? 'Crafting your plan...' : 'Élaboration de votre plan...'}
                        </h3>
                        <p className="text-gray-500 text-sm animate-pulse">
                            {language === 'en' ? 'Analyzing requirements and structuring tasks' : 'Analyse des besoins et structuration des tâches'}
                        </p>
                    </div>
                )}

                {/* Plan Display */}
                {plan && (
                    <div className="space-y-6 animate-fadeIn pb-6">
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                            <div className="prose prose-sm prose-purple max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-lg prose-p:text-gray-600 prose-li:text-gray-600">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {plan}
                                </ReactMarkdown>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="sticky bottom-0 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-lg flex items-center gap-3">
                            <button
                                onClick={handleExecutePlan}
                                disabled={isExecuting}
                                className="flex-1 bg-gradient-to-r from-gray-900 to-gray-800 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-black hover:to-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                            >
                                {isExecuting ? (
                                    <>
                                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        {language === 'en' ? 'Executing Agent...' : 'Exécution de l\'Agent...'}
                                    </>
                                ) : (
                                    <>
                                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        </span>
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
                                className="px-5 py-3 hover:bg-gray-50 text-gray-500 hover:text-red-500 rounded-xl font-medium transition-colors border border-transparent hover:border-red-100"
                                title={language === 'en' ? 'Discard Plan' : 'Rejeter le Plan'}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Execution Result */}
                {executionResult && (
                    <div className="mt-8 animate-fadeIn">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {language === 'en' ? 'Execution Complete' : 'Exécution Terminée'}
                                </h3>
                                <p className="text-sm text-green-600 font-medium">
                                    {language === 'en' ? 'All steps processed successfully' : 'Toutes les étapes ont été traitées avec succès'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-green-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-8 -mt-8 opacity-50 pointer-events-none"></div>

                            <div className="prose prose-sm prose-green max-w-none relative z-10">
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
