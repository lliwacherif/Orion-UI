import React, { useState, useEffect } from 'react';
import { X, Calendar, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import ClockTimePicker from './ClockTimePicker';

export interface AgentTask {
  id: string;
  taskName: string;
  instructions: string;
  schedule: 'daily' | 'weekly' | 'monthly';
  time: string; // Format: "HH:MM AM/PM"
  createdAt: string;
  lastRun?: string;
  enabled: boolean;
  isSearch?: boolean; // If true, uses web search instead of chat
}

interface AgentScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: AgentTask) => void;
  initialInstructions: string;
  existingTask?: AgentTask | null;
  isSearchMode?: boolean;
}

const AgentScheduleModal: React.FC<AgentScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialInstructions,
  existingTask,
  isSearchMode = false
}) => {
  const { language } = useLanguage();
  const [taskName, setTaskName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [schedule, setSchedule] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [time, setTime] = useState('09:00 AM');

  // Initialize with existing task or new instructions
  useEffect(() => {
    if (isOpen) {
      if (existingTask) {
        // Editing existing task
        setTaskName(existingTask.taskName);
        setInstructions(existingTask.instructions);
        setSchedule(existingTask.schedule);
        setTime(existingTask.time);
      } else if (initialInstructions && !instructions) {
        // New task from instructions
        setInstructions(initialInstructions);
        const autoName = initialInstructions.length > 50 
          ? initialInstructions.substring(0, 47) + '...' 
          : initialInstructions;
        setTaskName(autoName);
      }
    }
  }, [isOpen, existingTask, initialInstructions, instructions]);

  const handleSave = () => {
    if (!instructions.trim()) {
      alert(language === 'en' ? 'Instructions are required' : 'Les instructions sont requises');
      return;
    }

    const task: AgentTask = {
      id: existingTask?.id || Date.now().toString(),
      taskName: taskName.trim() || (language === 'en' ? 'Untitled Task' : 'Tâche sans titre'),
      instructions: instructions.trim(),
      schedule,
      time,
      createdAt: existingTask?.createdAt || new Date().toISOString(),
      lastRun: existingTask?.lastRun,
      enabled: existingTask?.enabled ?? true,
      isSearch: existingTask?.isSearch ?? isSearchMode
    };

    onSave(task);
    
    // Reset form
    setTaskName('');
    setInstructions('');
    setSchedule('daily');
    setTime('09:00 AM');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 text-white px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">
                    {language === 'en' ? 'Scheduled action' : 'Action planifiée'}
                  </h2>
                  {isSearchMode && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-sky-400 text-white rounded-full text-xs font-medium">
                      <Globe className="w-3 h-3" />
                      {language === 'en' ? 'Web Search' : 'Recherche Web'}
                    </span>
                  )}
                </div>
                <p className="text-purple-100 text-sm">
                  {isSearchMode 
                    ? (language === 'en' ? 'Schedule automated web searches' : 'Planifier des recherches Web automatisées')
                    : (language === 'en' ? 'Automate your workflow' : 'Automatisez votre flux de travail')
                  }
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition"
              title={language === 'en' ? 'Close' : 'Fermer'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Task Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'en' ? 'Name' : 'Nom'}
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder={language === 'en' ? 'e.g., Daily Summary Report' : 'ex., Rapport quotidien'}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-sm"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isSearchMode 
                ? (language === 'en' ? 'Search Query' : 'Requête de recherche')
                : (language === 'en' ? 'Instructions' : 'Instructions')
              }
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={isSearchMode
                ? (language === 'en' ? 'What do you want to search for?' : 'Que voulez-vous rechercher ?')
                : (language === 'en' ? 'What do you want the agent to do?' : 'Que voulez-vous que l\'agent fasse ?')
              }
              rows={4}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none text-sm"
            />
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'en' ? 'Schedule' : 'Planification'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={schedule}
                onChange={(e) => setSchedule(e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-sm appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.25rem',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="daily">{language === 'en' ? 'Daily' : 'Quotidien'}</option>
                <option value="weekly">{language === 'en' ? 'Weekly' : 'Hebdomadaire'}</option>
                <option value="monthly">{language === 'en' ? 'Monthly' : 'Mensuel'}</option>
              </select>

              <ClockTimePicker
                value={time}
                onChange={setTime}
                language={language}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {language === 'en' 
                ? 'Your prompt will run within an hour of the selected time'
                : 'Votre prompt s\'exécutera dans l\'heure suivant l\'heure sélectionnée'
              }
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex gap-3 justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium text-sm"
          >
            {language === 'en' ? 'Delete' : 'Supprimer'}
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
            >
              {language === 'en' ? 'Cancel' : 'Annuler'}
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition font-medium shadow-md text-sm"
            >
              {language === 'en' ? 'Save' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentScheduleModal;

