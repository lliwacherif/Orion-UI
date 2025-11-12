# Agent + Web Search Integration Guide

## 🌐 Scheduled Web Search Feature

This feature allows users to schedule automated web searches that run at specific times.

---

## 🎯 How to Create a Scheduled Web Search

### Step-by-Step

1. **Click + button** in message input
2. **Select "Agent"** from dropdown
3. **Purple "Agent" capsule appears**
4. **Click the globe icon** 🌐 (between Agent badge and X)
   - Globe turns **blue** when active
   - Placeholder changes to: *"Schedule a web search query..."*
5. **Type your search query** (e.g., "Latest AI news")
6. **Press Send/Enter**
7. **Modal opens** with:
   - "Web Search" badge in header
   - Your query pre-filled in "Search Query" field
   - Name auto-filled
   - Schedule and time selectors
8. **Set schedule** (Daily/Weekly/Monthly) and time
9. **Click Save**

---

## ⚙️ How It Works

### Regular Agent Task (Globe OFF)
```
User → Agent mode → Type instruction → Send
       ↓
Modal opens → Save task → Scheduled
       ↓
At scheduled time → Calls /orcha/chat → Shows response
```

### Web Search Agent Task (Globe ON - Blue)
```
User → Agent mode → Click globe (blue) → Type query → Send
       ↓
Modal opens with "Web Search" badge → Save task → Scheduled
       ↓
At scheduled time → Calls /orcha/search → DuckDuckGo → LLM refinement → Shows response
```

---

## 🎨 Visual Indicators

### **1. Agent Mode Toggle**

**Globe Button States:**
- **Inactive**: White background, gray globe icon
- **Active**: Sky blue background (`bg-sky-500`), white globe icon
- **Position**: Between Agent badge and X cancel button

### **2. Schedule Modal**

When `isSearch = true`:
- **Header Badge**: Light blue "Web Search" pill with globe icon
- **Subtitle**: "Schedule automated web searches"
- **Field Label**: "Search Query" (instead of "Instructions")
- **Placeholder**: "What do you want to search for?"

### **3. Task Manager Display**

Search tasks show:
- 🌐 **Globe icon** next to task name
- **Light blue badge**: "Search" with globe icon
- **Clear distinction** from regular agent tasks

### **4. Notification**

When task executes:
- Task name includes 🌐 emoji
- Shows AI-refined web search results
- Same beautiful notification card

---

## 📊 Task Types Comparison

| Feature | Regular Task | Web Search Task |
|---------|-------------|----------------|
| **Toggle** | Globe OFF (gray) | Globe ON (blue) |
| **Placeholder** | "Ask the agent..." | "Schedule a web search..." |
| **Modal Badge** | None | "Web Search" (blue) |
| **Modal Field** | "Instructions" | "Search Query" |
| **Backend Call** | `/orcha/chat` | `/orcha/search` |
| **Data Source** | LLM only | DuckDuckGo + LLM |
| **Icon in Manager** | None | 🌐 Globe |
| **Badge in Manager** | None | Blue "Search" |

---

## 🧪 Example Use Cases

### **Daily News Search**
- **Query**: "Latest technology news"
- **Schedule**: Daily at 8:00 AM
- **Result**: Fresh tech news every morning

### **Weekly Industry Updates**
- **Query**: "AI industry developments this week"
- **Schedule**: Weekly (Monday) at 9:00 AM
- **Result**: Weekly industry roundup

### **Monthly Reports**
- **Query**: "Major scientific breakthroughs this month"
- **Schedule**: Monthly at 9:00 AM
- **Result**: Monthly science summary

---

## 💾 Storage

### Task Object
```typescript
{
  id: "123",
  taskName: "Daily AI News",
  instructions: "Latest AI developments",
  schedule: "daily",
  time: "08:00 AM",
  isSearch: true,  // ← This flag determines search vs chat
  enabled: true,
  createdAt: "2025-11-11T...",
  lastRun: "2025-11-11T..."
}
```

### localStorage Keys
- `aura_agent_tasks`: All scheduled tasks (chat + search)
- `aura_search_conversations`: Conversation IDs from web searches

---

## 🎯 Key Features

- ✅ **Easy toggle**: One click to enable search mode
- ✅ **Visual feedback**: Blue globe when active
- ✅ **Smart placeholders**: Context-aware hints
- ✅ **Modal indicators**: Clear "Web Search" badge
- ✅ **Dual execution**: Backend routes correctly
- ✅ **Task management**: Edit/delete search tasks
- ✅ **Visual distinction**: Globe icons everywhere
- ✅ **Bilingual**: Full EN/FR support

---

## 🔍 Execution Flow

**When scheduled time arrives:**

1. **AgentTaskService** detects it's time to run
2. **Checks `isSearch` flag**:
   - If `true` → Calls `webSearch(query)`
   - If `false` → Calls `chat(message)`
3. **DuckDuckGo search** (if search task)
4. **LLM refinement** of results
5. **Response saved** to conversation history
6. **Notification shown** at bottom-right
7. **Globe icon** appears in sidebar

---

**Status**: ✅ Fully Implemented  
**Backend Integration**: Complete  
**Frontend Components**: 6 files updated  
**Zero Errors**: ✅  
**Created**: November 2025


