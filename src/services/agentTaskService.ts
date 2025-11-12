import type { AgentTask } from '../components/AgentScheduleModal';

const STORAGE_KEY = 'aura_agent_tasks';
const LAST_CHECK_KEY = 'aura_agent_last_check';

export class AgentTaskService {
  /**
   * Save a new agent task to localStorage
   */
  static saveTask(task: AgentTask): void {
    const tasks = this.getAllTasks();
    tasks.push(task);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    console.log('✅ Agent task saved:', task);
  }

  /**
   * Get all agent tasks from localStorage
   */
  static getAllTasks(): AgentTask[] {
    const tasksJson = localStorage.getItem(STORAGE_KEY);
    if (!tasksJson) return [];
    
    try {
      return JSON.parse(tasksJson);
    } catch (error) {
      console.error('Failed to parse agent tasks:', error);
      return [];
    }
  }

  /**
   * Update an existing task
   */
  static updateTask(taskId: string, updates: Partial<AgentTask>): void {
    const tasks = this.getAllTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      console.log('✅ Agent task updated:', tasks[index]);
    }
  }

  /**
   * Delete a task
   */
  static deleteTask(taskId: string): void {
    const tasks = this.getAllTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log('🗑️ Agent task deleted:', taskId);
  }

  /**
   * Check if any tasks should be executed now
   */
  static checkScheduledTasks(): AgentTask[] {
    const tasks = this.getAllTasks();
    const now = new Date();
    const tasksToRun: AgentTask[] = [];

    tasks.forEach(task => {
      if (!task.enabled) return;

      if (this.shouldRunTask(task, now)) {
        tasksToRun.push(task);
        // Update last run time
        this.updateTask(task.id, { lastRun: now.toISOString() });
      }
    });

    // Update last check time
    localStorage.setItem(LAST_CHECK_KEY, now.toISOString());

    return tasksToRun;
  }

  /**
   * Determine if a task should run based on its schedule
   */
  private static shouldRunTask(task: AgentTask, now: Date): boolean {
    const lastRun = task.lastRun ? new Date(task.lastRun) : null;
    const taskTime = this.parseTime(task.time);
    const currentTime = {
      hours: now.getHours(),
      minutes: now.getMinutes()
    };

    // Check if current time matches task time (within 1 minute)
    const timeMatches = 
      Math.abs(currentTime.hours - taskTime.hours) === 0 &&
      Math.abs(currentTime.minutes - taskTime.minutes) <= 1;

    if (!timeMatches) return false;

    // If never run before, run it
    if (!lastRun) return true;

    const daysSinceLastRun = Math.floor((now.getTime() - lastRun.getTime()) / (1000 * 60 * 60 * 24));

    switch (task.schedule) {
      case 'daily':
        return daysSinceLastRun >= 1;
      case 'weekly':
        return daysSinceLastRun >= 7;
      case 'monthly':
        return daysSinceLastRun >= 30;
      default:
        return false;
    }
  }

  /**
   * Parse time string (e.g., "09:00 AM") to hours and minutes
   */
  private static parseTime(timeStr: string): { hours: number; minutes: number } {
    const [time, ampm] = timeStr.split(' ');
    const [hoursStr, minutesStr] = time.split(':');
    let hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);

    if (ampm === 'PM' && hours !== 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }

    return { hours, minutes };
  }

  /**
   * Get the last time tasks were checked
   */
  static getLastCheckTime(): Date | null {
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    return lastCheck ? new Date(lastCheck) : null;
  }

  /**
   * Clear all tasks (for testing/debugging)
   */
  static clearAllTasks(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_CHECK_KEY);
    console.log('🗑️ All agent tasks cleared');
  }
}

