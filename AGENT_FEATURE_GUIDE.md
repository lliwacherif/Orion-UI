# Agent Scheduling Feature Guide

## Overview

The Agent feature allows users to schedule automated tasks that run at specific times (daily, weekly, or monthly). When a task is executed, the agent sends instructions to the ORCHA model and displays the results in a notification card.

---

## How to Use

### 1. **Activate Agent Mode**
- Click the **+** button in the message input area
- Select **Agent** from the dropdown menu (purple clock icon)
- A purple glassy capsule badge will appear with "Agent" text
- The placeholder text changes to: *"Ask the agent to do stuff for you..."*

### 2. **Create a Scheduled Task**
- Type your instructions in the input field (e.g., "Summarize today's news")
- Press **Send** or hit **Enter**
- The **Agent Schedule Modal** will appear with the following fields:

  **Modal Fields:**
  - **Name**: Auto-filled from your instructions (editable)
  - **Instructions**: Pre-filled with what you typed
  - **Schedule**: Two dropdown selects
    - Frequency: Daily / Weekly / Monthly
    - Time: 30-minute intervals from 12:00 AM to 11:30 PM
  - **Note**: "Your prompt will run within an hour of the selected time"

- Click **Save** to schedule the agent task
- Click **Delete** to remove an existing task (left side)
- Click **Cancel** to close without saving

### 3. **Task Execution**
- Tasks are stored in browser localStorage
- On app startup, the scheduler checks for pending tasks
- Every minute, the app checks if any tasks should run
- When it's time, the agent automatically sends the instruction to ORCHA

### 4. **View Results**
- When a task completes, a notification card appears at the **bottom right**
- The card slides in from right to left with smooth animation
- Displays:
  - Task name
  - Execution timestamp
  - Model response (formatted as Markdown)
- Auto-closes after 15 seconds or click **X** to dismiss manually

---

## Technical Details

### Components Created

1. **`AgentScheduleModal.tsx`**
   - Modal for scheduling tasks
   - Validates required fields
   - Saves to localStorage via AgentTaskService

2. **`AgentNotification.tsx`**
   - Bottom-right notification card
   - Smooth slide-in/slide-out animation
   - Renders Markdown responses
   - Auto-dismiss after 15 seconds

3. **`agentTaskService.ts`**
   - Manages task storage in localStorage
   - Checks scheduled tasks every minute
   - Determines if a task should run based on schedule
   - Tracks last run time to prevent duplicate executions

### Storage

Tasks are stored in `localStorage` with the key:
- `aura_agent_tasks`: Array of all agent tasks
- `aura_agent_last_check`: Last time tasks were checked

### Task Object Structure

```typescript
interface AgentTask {
  id: string;
  taskName: string;
  instructions: string;
  schedule: 'daily' | 'weekly' | 'monthly';
  time: string; // Format: "HH:MM AM/PM"
  createdAt: string;
  lastRun?: string;
  enabled: boolean;
}
```

### Scheduler Logic

- **Startup**: Checks all tasks immediately when app loads
- **Interval**: Checks every 60 seconds (1 minute)
- **Execution Window**: Tasks execute if current time matches task time ±1 minute
- **Frequency Check**:
  - **Daily**: Runs if 24+ hours since last run
  - **Weekly**: Runs if 7+ days since last run
  - **Monthly**: Runs if 30+ days since last run

---

## User Flow Example

1. User clicks **+** → **Agent**
2. Purple "Agent" capsule appears
3. User types: *"Generate a daily summary of my tasks"*
4. User clicks **Send**
5. Modal opens with instructions pre-filled
6. User sets:
   - Task Name: "Daily Task Summary"
   - Schedule: Daily
   - Time: 09:00 AM
7. User clicks **Save Task**
8. Confirmation alert appears
9. Next day at 9:00 AM:
   - Agent automatically sends instruction to model
   - Model responds with task summary
   - Notification card slides in at bottom-right
   - User sees the summary in beautiful Markdown format

---

## Styling

### Agent Capsule Badge
- **Colors**: Purple gradient (`from-purple-500 to-indigo-600`)
- **Style**: Rounded pill with shadow and backdrop blur
- **Icon**: Clock icon

### Schedule Modal
- **Title**: "Scheduled action" with purple gradient header
- **Inputs**: Gray backgrounds with rounded corners
- **Dropdowns**: Custom styled select elements with chevron icons
- **Schedule**: Two-column grid layout (Frequency + Time)
- **Buttons**: 
  - Delete (left, red text)
  - Cancel (right, white with border)
  - Save (right, purple gradient)
- **Layout**: Clean, compact form with consistent spacing

### Notification Card
- **Position**: Fixed bottom-right (6px from edges)
- **Animation**: Slide from right with opacity fade
- **Max Width**: 450px
- **Max Height**: 400px (scrollable content)
- **Header**: Purple gradient with task name and timestamp
- **Footer**: Gradient background with dismiss button

---

## API Integration

When a task executes, it calls:

```typescript
POST /api/v1/orcha/chat
{
  "user_id": "123",
  "tenant_id": "optional",
  "message": "User's scheduled instruction",
  "use_rag": false,
  "conversation_history": []
}
```

Response is displayed in the notification card as Markdown.

---

## Managing Tasks

### View Tasks
Currently, tasks are stored in localStorage. To view them:
```javascript
// In browser console
const tasks = JSON.parse(localStorage.getItem('aura_agent_tasks') || '[]');
console.table(tasks);
```

### Delete All Tasks (for testing)
```javascript
// In browser console
localStorage.removeItem('aura_agent_tasks');
localStorage.removeItem('aura_agent_last_check');
```

---

## Future Enhancements

Potential improvements:
- [ ] Task management UI (view/edit/delete scheduled tasks)
- [ ] Task history and logs
- [ ] More schedule options (hourly, custom intervals)
- [ ] Task categories and tags
- [ ] Email/push notifications
- [ ] Backend persistence (instead of localStorage)
- [ ] Multi-timezone support
- [ ] Conditional task execution (if/then logic)

---

**Feature Status**: ✅ Fully Implemented  
**Created**: November 2025  
**Components**: 3 new files + 3 modified files  
**Zero Linting Errors**: ✅

