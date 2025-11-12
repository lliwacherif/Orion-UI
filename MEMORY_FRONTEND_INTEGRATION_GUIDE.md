# 🧠 Frontend Memory Integration Guide

## Overview

This guide explains how to integrate the **User Memory** feature into your frontend application. The memory system stores AI-extracted personal information and preferences about users, which can be displayed in the UI to show what the AI "remembers" about them.

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Response Formats](#response-formats)
- [Implementation Status](#implementation-status)
- [UI Components](#ui-components)
- [Error Handling](#error-handling)
- [Testing](#testing)

---

## Quick Start

### Base URL

```
http://localhost:8000/api/v1
```

### Available Endpoints

1. **GET /memory/{user_id}** - Retrieve user's memory
2. **POST /memory** - Save/update user's memory (automated)

---

## API Endpoints

### 1. Get User Memory

Retrieve the stored memory for a specific user.

**Endpoint:** `GET /api/v1/memory/{user_id}`

**Example Request:**

```javascript
const userId = 123;
fetch(`http://localhost:8000/api/v1/memory/${userId}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

**Success Response (Memory Exists):**

```json
{
  "status": "ok",
  "memory": {
    "content": "User prefers formal communication. Works in the insurance industry specializing in risk assessment. Interested in AI applications for document processing. Based in Paris, France. Prefers responses in French when discussing technical topics.",
    "created_at": "2025-11-01T10:30:00",
    "updated_at": "2025-11-04T14:22:15"
  }
}
```

**Success Response (No Memory):**

```json
{
  "status": "ok",
  "memory": null
}
```

**Error Response:**

```json
{
  "detail": "User not found"
}
```

### 2. Save/Update User Memory

> ⚠️ **Note:** This endpoint is called automatically by the frontend after memory generation.

**Endpoint:** `POST /api/v1/memory`

**Request Body:**

```json
{
  "user_id": 123,
  "content": "User prefers formal communication. Works in insurance..."
}
```

**Response:**

```json
{
  "status": "ok",
  "message": "Memory saved successfully"
}
```

---

## Response Formats

### Memory Object Structure

| Field | Type | Description |
|-------|------|-------------|
| `content` | string | The AI-extracted memory content |
| `created_at` | string (ISO 8601) | When the memory was first created |
| `updated_at` | string (ISO 8601) | When the memory was last updated |

### Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process the memory data |
| 404 | User not found | Show error message |
| 500 | Server error | Show error and retry option |

---

## Implementation Status

### ✅ Already Implemented

The AURA UI frontend has **full memory integration** implemented:

#### 1. **Memory Generation**
- Located in: `src/components/UserProfile.tsx`
- User clicks "Memory" button in their profile
- System analyzes recent conversations
- Generates personalized memory summary
- **Automatically saves to backend database**

#### 2. **Memory Display Modal**
- ChatGPT-style dark modal interface
- Features:
  - Display all stored memory elements
  - Search functionality to filter memories
  - Empty state when no memory exists
  - Loading states
  - Bilingual support (English/French)

#### 3. **API Integration**
- Located in: `src/api/orcha.ts`
- `saveMemory(userId, content)` - Auto-saves after generation
- `getMemory(userId)` - Retrieves stored memory

#### 4. **User Flow**

```
1. User clicks Memory button
   ↓
2. System generates memory from conversations
   ↓
3. Memory displayed to user (first modal)
   ↓
4. Memory auto-saved to database
   ↓
5. User clicks "Show Memory Elements"
   ↓
6. Stored memory retrieved and displayed (second modal)
```

---

## UI Components

### Memory Generation Modal

- **Location**: User Profile → Memory button
- **Purpose**: Generate and display current memory
- **Features**:
  - Animated loading state
  - Markdown rendering
  - Auto-save to backend
  - Button to view stored elements

### Memory Elements Modal (ChatGPT-style)

- **Location**: Memory Modal → "Show Memory Elements"
- **Design**:
  - Dark theme (`#2f2f2f`, `#343541`, `#40414f`)
  - Storage indicator badge (100%)
  - Search bar with icons
  - Memory items as cards
  - Empty state with guidance
- **Features**:
  - Live search filtering
  - Responsive design
  - Smooth animations
  - Bilingual interface

### Screenshots

**Memory Elements Modal includes:**
- Title: "Éléments mémorisés" / "Memory Elements"
- Badge: "Remplissage : 100 %" / "Storage: 100 %"
- Description about memory retention
- Search bar: "Rechercher dans les éléments mémorisés"
- Memory items displayed as text blocks
- Sort and filter buttons

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 404 User not found | Invalid user_id | Verify user authentication |
| 500 Server error | Database connection issue | Check backend logs |
| Network error | Backend not running | Ensure backend is running |
| null memory | No memory created yet | Generate first memory |

### Error Handling in Code

```typescript
// From src/components/UserProfile.tsx
const loadStoredMemory = async () => {
  try {
    const response = await getMemory(user.id);
    if (response.memory && response.memory.content) {
      setStoredMemoryContent(response.memory.content);
    } else {
      setStoredMemoryContent(null); // Empty state
    }
  } catch (error) {
    console.error('Failed to load stored memory:', error);
    setStoredMemoryContent(null);
  }
};
```

---

## Testing

### Backend Requirements

For the frontend to work properly, your backend must:

1. **Implement GET /api/v1/memory/{user_id}**
   - Returns existing memory or null
   - Status code 200 for success

2. **Implement POST /api/v1/memory**
   - Accepts `user_id` and `content`
   - Creates or updates memory record
   - Returns success confirmation

3. **Database Model: UserMemory**
   - Fields: `id`, `user_id`, `content`, `created_at`, `updated_at`
   - Index on `user_id` for performance

### Test with Browser Console

```javascript
// Test GET endpoint
fetch('http://localhost:8000/api/v1/memory/1')
  .then(r => r.json())
  .then(console.log);

// Test POST endpoint
fetch('http://localhost:8000/api/v1/memory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 1,
    content: 'Test memory content'
  })
})
  .then(r => r.json())
  .then(console.log);
```

### Expected Behavior

1. **First time user generates memory:**
   - Memory modal shows generated content
   - Backend receives POST request to save
   - "Show Memory Elements" retrieves and displays saved content

2. **Subsequent memory generations:**
   - New memory overwrites old memory
   - "Show Memory Elements" shows latest version
   - Updated timestamp reflects changes

---

## Integration Checklist for Backend

- [ ] Create `UserMemory` database model
- [ ] Implement `GET /api/v1/memory/{user_id}` endpoint
- [ ] Implement `POST /api/v1/memory` endpoint
- [ ] Add database migration for `user_memories` table
- [ ] Test endpoints with curl/Postman
- [ ] Verify CORS allows frontend origin
- [ ] Test with frontend application
- [ ] (Optional) Add memory to chat context in orchestrator

---

## API Contract Examples

### GET /api/v1/memory/1

**cURL:**
```bash
curl -X GET http://localhost:8000/api/v1/memory/1 \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "status": "ok",
  "memory": {
    "content": "User is interested in AI and insurance technology...",
    "created_at": "2025-11-04T10:30:00",
    "updated_at": "2025-11-04T14:22:15"
  }
}
```

### POST /api/v1/memory

**cURL:**
```bash
curl -X POST http://localhost:8000/api/v1/memory \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "content": "User prefers detailed technical explanations. Works in FinTech."
  }'
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Memory saved successfully"
}
```

---

## Troubleshooting

### Memory not showing up?

1. Check browser console for API errors
2. Verify backend is running on port 8000
3. Check network tab - look for `/memory/` requests
4. Verify user has generated at least one memory

### Memory not saving?

1. Check backend logs for POST request
2. Verify database connection
3. Check `user_memories` table exists
4. Verify CORS configuration

### Modal not appearing?

1. Check z-index conflicts (modals use z-[60] and z-[70])
2. Verify React state updates
3. Check browser console for errors

---

## Advanced Features (Future)

- **Memory in Chat Context**: Backend can inject stored memory into system prompts
- **Memory Editing**: Allow users to modify stored memories
- **Memory Deletion**: Clear all stored memories
- **Memory Categories**: Tag and organize memories
- **Memory Analytics**: Track memory usage and updates

---

## Related Files

### Frontend Files
- `src/components/UserProfile.tsx` - Memory UI and logic
- `src/api/orcha.ts` - API functions (`saveMemory`, `getMemory`)
- `src/translations/index.ts` - Bilingual text

### Backend Files (To Implement)
- `app/api/v1/endpoints.py` - Memory endpoints
- `app/db/models.py` - UserMemory model
- `app/services/orchestrator.py` - Memory context injection

---

## Support

For backend implementation details, refer to:
- `MEMORY_STORAGE_GUIDE.md` - Complete backend guide

**Questions?** Check:
- Backend logs in console
- Network requests in browser DevTools
- Database records in your DB client

---

**Status**: ✅ Frontend implementation complete and ready for backend integration!




