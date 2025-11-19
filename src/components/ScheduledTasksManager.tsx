import React, { useState, useEffect } from 'react';
import { X, Clock, Trash2, Edit2, Calendar, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { AgentTaskService } from '../services/agentTaskService';
import type { AgentTask } from './AgentScheduleModal';
import AgentScheduleModal from './AgentScheduleModal';

interface ScheduledTasksManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ScheduledTasksManager: React.FC<ScheduledTasksManagerProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [editingTask, setEditingTask] = useState<AgentTask | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Load tasks when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTasks();
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500/80 via-purple-600/80 to-indigo-600/80 backdrop-blur-md text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {language === 'en' ? 'Scheduled Tasks' : 'Tâches Planifiées'}
                  </h2>
                  <p className="text-purple-100 text-sm">
                    {language === 'en' ? 'Manage your automated tasks' : 'Gérez vos tâches automatisées'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {language === 'en' ? 'No scheduled tasks' : 'Aucune tâche planifiée'}
                </h3>
                <p className="text-gray-500 text-sm">
                  {language === 'en'
                    ? 'Create your first automated task from the Agent menu'
                    : 'Créez votre première tâche automatisée depuis le menu Agent'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`bg-white/60 backdrop-blur-sm border rounded-xl p-4 transition-all ${task.enabled
                        ? 'border-purple-200 hover:border-purple-300 hover:shadow-md'
                        : 'border-gray-200 opacity-60'
                      }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      {/* Task Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            {task.isSearch && (
                              <span title={language === 'en' ? 'Web search task' : 'Tâche de recherche Web'}>
                                <Globe className="w-4 h-4 text-sky-500" />
                              </span>
                            )}
                            <h3 className="font-semibold text-gray-900">
                              {task.taskName}
                            </h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              <Clock className="w-3 h-3" />
                              {task.time}
                            </span>
                            <span className="inline-flex px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                              {getScheduleLabel(task.schedule)}
                            </span>
                            {task.isSearch && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
                                <Globe className="w-3 h-3" />
                                {language === 'en' ? 'Search' : 'Recherche'}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {task.instructions}
                        </p>
                        {task.lastRun && (
                          <p className="text-xs text-gray-500">
                            {language === 'en' ? 'Last run: ' : 'Dernière exécution: '}
                            {new Date(task.lastRun).toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* Actions - Responsive layout */}
                      <div className="flex md:flex-col gap-2 justify-end">
                        {/* Enable/Disable Toggle */}
                        <button
                          onClick={() => handleToggleTask(task)}
                          className={`flex-1 md:flex-none px-4 md:px-3 py-2 rounded-lg transition text-sm font-medium flex items-center justify-center gap-2 ${task.enabled
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                            }`}
                          title={task.enabled
                            ? (language === 'en' ? 'Disable' : 'Désactiver')
                            : (language === 'en' ? 'Enable' : 'Activer')
                          }
                        >
                          <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center">
                            {task.enabled && (
                              <div className="w-2 h-2 bg-green-700 rounded-full" />
                            )}
                          </div>
                          <span className="md:hidden">
                            {task.enabled
                              ? (language === 'en' ? 'Enabled' : 'Activé')
                              : (language === 'en' ? 'Disabled' : 'Désactivé')
                            }
                          </span>
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleEditTask(task)}
                          className="flex-1 md:flex-none px-4 md:px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
                          title={language === 'en' ? 'Edit' : 'Modifier'}
                        >
                          <Edit2 className="w-4 h-4" />
                          <span className="md:hidden">{language === 'en' ? 'Edit' : 'Modifier'}</span>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="flex-1 md:flex-none px-4 md:px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
                          title={language === 'en' ? 'Delete' : 'Supprimer'}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="md:hidden">{language === 'en' ? 'Delete' : 'Supprimer'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-white/60 backdrop-blur-sm px-6 py-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {tasks.length} {tasks.length === 1
                ? (language === 'en' ? 'task' : 'tâche')
                : (language === 'en' ? 'tasks' : 'tâches')
              }
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg hover:bg-white transition font-medium text-sm"
            >
              {language === 'en' ? 'Close' : 'Fermer'}
            </button>
          </div>
        </div>
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
    </>
  );
};

export default ScheduledTasksManager;

