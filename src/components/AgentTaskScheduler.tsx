import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Calendar, Globe, Plus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { AgentTaskService } from '../services/agentTaskService';
import type { AgentTask } from './AgentScheduleModal';
import AgentScheduleModal from './AgentScheduleModal';

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
        <div className="flex flex-col h-full bg-white/50 backdrop-blur-sm rounded-3xl border border-white/40 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/30 bg-white/40 backdrop-blur-md flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Calendar className="w-5 h-5" />
                    </span>
                    {language === 'en' ? 'Schedule a Task' : 'Planifier une Tâche'}
                </h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"
                    title={language === 'en' ? 'New Task' : 'Nouvelle Tâche'}
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            {language === 'en' ? 'No scheduled tasks' : 'Aucune tâche planifiée'}
                        </h3>
                        <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                            {language === 'en'
                                ? 'Automate your workflow by scheduling recurring tasks.'
                                : 'Automatisez votre flux de travail en planifiant des tâches récurrentes.'
                            }
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium shadow-lg hover:bg-indigo-700 transition"
                        >
                            {language === 'en' ? 'Create Task' : 'Créer une Tâche'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className={`bg-white/60 backdrop-blur-sm border rounded-xl p-4 transition-all ${task.enabled
                                    ? 'border-indigo-200 hover:border-indigo-300 hover:shadow-md'
                                    : 'border-gray-200 opacity-60'
                                    }`}
                            >
                                <div className="flex flex-col gap-3">
                                    {/* Task Info */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {task.isSearch && (
                                                    <span title={language === 'en' ? 'Web search task' : 'Tâche de recherche Web'}>
                                                        <Globe className="w-4 h-4 text-sky-500" />
                                                    </span>
                                                )}
                                                <h3 className="font-semibold text-gray-900 line-clamp-1">
                                                    {task.taskName}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-medium uppercase tracking-wide">
                                                    {task.time}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-600 line-clamp-2 mb-3 min-h-[2.5em]">
                                            {task.instructions}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium">
                                                {getScheduleLabel(task.schedule)}
                                            </span>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleToggleTask(task)}
                                                    className={`p-1.5 rounded-lg transition ${task.enabled
                                                        ? 'text-green-600 hover:bg-green-50'
                                                        : 'text-gray-400 hover:bg-gray-100'
                                                        }`}
                                                    title={task.enabled ? (language === 'en' ? 'Disable' : 'Désactiver') : (language === 'en' ? 'Enable' : 'Activer')}
                                                >
                                                    <div className={`w-3 h-3 rounded-full border-2 ${task.enabled ? 'bg-green-600 border-green-600' : 'border-gray-400'}`} />
                                                </button>
                                                <button
                                                    onClick={() => handleEditTask(task)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title={language === 'en' ? 'Edit' : 'Modifier'}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title={language === 'en' ? 'Delete' : 'Supprimer'}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
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
