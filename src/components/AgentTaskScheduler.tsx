import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Calendar, Globe, Plus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { AgentTaskService } from '../services/agentTaskService';
import type { AgentTask } from './AgentScheduleModal';
import AgentScheduleModal from './AgentScheduleModal';
import ClockTimePicker from './ClockTimePicker';

const AgentTaskScheduler: React.FC = () => {
    const { language } = useLanguage();
    const [tasks, setTasks] = useState<AgentTask[]>([]);
    const [editingTask, setEditingTask] = useState<AgentTask | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Load tasks on mount
    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = () => {
        const allTasks = AgentTaskService.getAllTasks();
        setTasks(allTasks);
    };

    const handleDeleteTask = (taskId: string) => {
        if (window.confirm(language === 'en' ? 'Are you sure you want to delete this task?' : 'Voulez-vous vraiment supprimer cette tâche ?')) {
            AgentTaskService.deleteTask(taskId);
            loadTasks();
        }
    };

    const handleEditTask = (task: AgentTask) => {
        setEditingTask(task);
        setShowEditModal(true);
    };

    const handleSaveEdit = (updatedTask: AgentTask) => {
        if (editingTask) {
            AgentTaskService.updateTask(editingTask.id, updatedTask);
            setShowEditModal(false);
            setEditingTask(null);
            loadTasks();
        }
    };

    const handleCreateTask = (newTask: AgentTask) => {
        AgentTaskService.saveTask(newTask);
        setShowCreateModal(false);
        loadTasks();
    };

    const handleToggleTask = (task: AgentTask) => {
        AgentTaskService.updateTask(task.id, { enabled: !task.enabled });
        loadTasks();
    };

    const getScheduleLabel = (schedule: string) => {
        switch (schedule) {
            case 'daily':
                return language === 'en' ? 'Daily' : 'Quotidien';
            case 'weekly':
                return language === 'en' ? 'Weekly' : 'Hebdomadaire';
            case 'monthly':
                return language === 'en' ? 'Monthly' : 'Mensuel';
            default:
                return schedule;
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl border border-indigo-100 shadow-xl shadow-indigo-900/5 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        {language === 'en' ? 'Scheduled Tasks' : 'Tâches Planifiées'}
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                        {language === 'en' ? 'Manage your automated workflows' : 'Gérez vos flux de travail automatisés'}
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 group"
                    title={language === 'en' ? 'New Task' : 'Nouvelle Tâche'}
                >
                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 custom-scrollbar">
                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 relative">
                            <div className="absolute inset-0 bg-indigo-100/50 rounded-full animate-pulse"></div>
                            <Calendar className="w-8 h-8 text-indigo-500 relative z-10" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                            {language === 'en' ? 'No scheduled tasks' : 'Aucune tâche planifiée'}
                        </h3>
                        <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                            {language === 'en'
                                ? 'Automate your daily routine by scheduling recurring tasks for your agent.'
                                : 'Automatisez votre routine quotidienne en planifiant des tâches récurrentes pour votre agent.'
                            }
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 bg-white border border-indigo-100 text-indigo-600 rounded-xl font-semibold shadow-sm hover:bg-indigo-50 transition flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            {language === 'en' ? 'Create First Task' : 'Créer une Première Tâche'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className={`group bg-white border rounded-2xl p-5 transition-all duration-300 ${task.enabled
                                    ? 'border-indigo-100 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-900/5'
                                    : 'border-gray-100 opacity-75 grayscale-[0.5]'
                                    }`}
                            >
                                <div className="flex flex-col gap-4">
                                    {/* Task Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 p-2 rounded-lg ${task.isSearch ? 'bg-sky-50 text-sky-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                                {task.isSearch ? <Globe className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 line-clamp-1 text-base">
                                                    {task.taskName}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                                                        <ClockTimePicker language="en" value="" onChange={() => { }} />
                                                        {task.time}
                                                    </span>
                                                    <span className="text-gray-300 text-xs">•</span>
                                                    <span className="text-xs font-medium text-indigo-600">
                                                        {getScheduleLabel(task.schedule)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditTask(task)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                title={language === 'en' ? 'Edit' : 'Modifier'}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title={language === 'en' ? 'Delete' : 'Supprimer'}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Instructions Preview */}
                                    <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 line-clamp-2 leading-relaxed border border-gray-100">
                                        {task.instructions}
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${task.enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                                            <span className="text-xs font-medium text-gray-500">
                                                {task.enabled
                                                    ? (language === 'en' ? 'Active' : 'Actif')
                                                    : (language === 'en' ? 'Paused' : 'En pause')
                                                }
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => handleToggleTask(task)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${task.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span className="sr-only">Use setting</span>
                                            <span
                                                aria-hidden="true"
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${task.enabled ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {showEditModal && editingTask && (
                <AgentScheduleModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingTask(null);
                    }}
                    onSave={handleSaveEdit}
                    initialInstructions={editingTask.instructions}
                    existingTask={editingTask}
                />
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <AgentScheduleModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSave={handleCreateTask}
                    initialInstructions=""
                />
            )}
        </div>
    );
};

export default AgentTaskScheduler;
