# ORCHA Chat Integration Guide

## Overview

The AURA UI now communicates directly with the **ORCHA Chat API** which connects to **LM Studio** for AI-powered responses. Users can chat with the AI, enable RAG for document search, and see contextual sources.

## What Changed

### Before (Routing Demo)
- Called `/orcha/route` to see routing decisions
- Displayed endpoint recommendations and prepared payloads
- No actual AI responses

### After (Live Chat)
- Calls `/orcha/chat` to get AI responses from LM Studio
- Displays actual assistant messages
- Shows RAG sources/contexts when available
- Full conversational AI experience

## New Features

### 1. **AI Chat with LM Studio**
- Real conversational AI powered by LM Studio models
- Natural language responses
- Context-aware conversations

### 2. **RAG Integration**
- Toggle "Use RAG" to enable document search
- AI responses include relevant document contexts
- Sources displayed as badges with relevance scores

### 3. **Source Display**
- When RAG is enabled, sources appear below assistant messages
- Each source shows:
  - Document ID or source name
  - Relevance score (as percentage)
  - Hover to see context snippet

### 4. **Error Handling**
- Connection errors to LM Studio
- Invalid requests
- OCR queuing status

## API Endpoints

### Chat Endpoint
```
POST /api/v1/orcha/chat
```

**Request:**
```typescript
{
  user_id: string;
  tenant_id?: string;
  message: string;
  attachments?: Attachment[];
  use_rag?: boolean;
}
```

**Response (Success):**
```typescript
{
  status: 'ok',
  message: 'AI response text',
  contexts?: Context[],  // Present when use_rag=true
  model_response: {...}  // Full LM Studio response
}
```

**Response (Error):**
```typescript
{
  status: 'error',
  error: 'Error message',
  message: null
}
```

**Response (OCR Queued):**
```typescript
{
  status: 'ocr_queued',
  jobs: ['job-id-1', 'job-id-2']
}
```

## Component Updates

### 1. **ChatWindow.tsx**
- Changed from `route()` to `chat()` API call
- Handles `ChatResponse` instead of `RouteResponse`
- Displays assistant messages with content
- Shows OCR queued status
- Updated info banner to reflect chat functionality

### 2. **MessageBubble.tsx**
- Added source/context display
- Shows RAG sources as badges
- Displays relevance scores
- Hover tooltips for context snippets

### 3. **API Layer (orcha.ts)**
- New `chat()` function for `/orcha/chat` endpoint
- Kept `route()` for future routing visualization
- TypeScript types for `ChatRequest` and `ChatResponse`

### 4. **Types (orcha.d.ts)**
- `ChatRequest` interface
- `ChatResponse` interface  
- `Context` interface for RAG sources
- Updated `Message` type with `contexts` field

## Usage Examples

### Basic Chat

1. Login with user ID
2. Type a message: "Hello, how are you?"
3. Press Enter or click Send
4. See AI response in chat

### Chat with RAG

1. Login with user ID
2. Enable "Use RAG" checkbox
3. Type a question: "What are our company policies?"
4. Press Enter
5. See AI response with source badges below

### With Attachments

1. Login with user ID
2. Click 📎 to attach image/PDF
3. Type: "What's in this document?"
4. Press Enter
5. OCR processes file
6. AI analyzes and responds

## UI Components

### Message Types

**User Message:**
- Blue bubble, right-aligned
- Shows sent message and attachments

**Assistant Message:**
- Gray bubble, left-aligned
- AI response text
- Optional source badges (when RAG is used)

**Error Message:**
- Red bubble, left-aligned
- Error description

**Loading:**
- Animated dots indicator
- Shows while waiting for AI response

### Source Badges

When RAG is enabled, sources appear as:

```
Sources:
[document-123 95%] [policy-doc 87%] [guide-456 82%]
```

- Hover to see context snippet
- Click (future: navigate to document)
- Percentage shows relevance score

## Configuration

### Environment Variables

```env
# .env
VITE_API_URL=/api/v1
```

With Vite proxy (already configured):
```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  },
}
```

### LM Studio Connection

Backend is pre-configured to connect to:
```
http://192.168.1.37:1234
```

Update in your ORCHA backend if needed.

## Translations

New translations added for:

**English:**
- `assistant.sources` - "Sources:"
- `assistant.thinking` - "Thinking..."
- `assistant.ocrQueued` - "Processing attachments... Job IDs:"
- `assistant.errorTitle` - "Error"

**French:**
- `assistant.sources` - "Sources :"
- `assistant.thinking` - "Réflexion..."
- `assistant.ocrQueued` - "Traitement des pièces jointes... ID des tâches :"
- `assistant.errorTitle` - "Erreur"

## Testing

### Test 1: Basic Chat

```bash
curl -X POST http://localhost:8000/api/v1/orcha/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "message": "Hello, introduce yourself"
  }'
```

**Expected:** AI introduction response

### Test 2: RAG Query

```bash
curl -X POST http://localhost:8000/api/v1/orcha/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "message": "What are our company values?",
    "use_rag": true
  }'
```

**Expected:** Response with `contexts` array

### Test 3: UI Testing

1. **Login**
   - Enter user ID: "test_user"
   - Click Continue

2. **Basic Chat**
   - Type: "What is 2+2?"
   - Press Enter
   - See AI response

3. **RAG Chat**
   - Enable "Use RAG"
   - Type: "Search for documentation about X"
   - Press Enter
   - See response with source badges

4. **Language Toggle**
   - Click 🇫🇷 FR in top-right
   - See UI switch to French
   - Chat history preserved

## Error Handling

### LM Studio Connection Error

**Backend returns:**
```json
{
  "status": "error",
  "error": "Connection refused to LM Studio"
}
```

**UI displays:**
Red error bubble with connection error message

### Invalid Request

**Backend returns:**
```json
{
  "status": "error",
  "error": "Invalid user_id"
}
```

**UI displays:**
Red error bubble with validation error

### Network Error

**Axios throws error**

**UI displays:**
"Error: Failed to send message"

## Performance Notes

### Response Times

- **Without RAG:** ~1-3 seconds (LM Studio processing)
- **With RAG:** ~2-5 seconds (search + LM Studio)
- **OCR:** Async (queued, not immediate)

### Optimization

- Messages cached in localStorage
- React Query handles request state
- No auto-retry on failure (user must resend)

## Future Enhancements

Potential improvements:

- [ ] **Streaming responses** - Show AI response as it generates
- [ ] **Message editing** - Edit and resend messages
- [ ] **Conversation branching** - Fork conversations
- [ ] **Source clicking** - Navigate to full document
- [ ] **Model selection** - Choose LM Studio model
- [ ] **Temperature control** - Adjust AI creativity
- [ ] **System prompts** - Custom AI behavior
- [ ] **Export conversations** - Download chat history

## Troubleshooting

### Issue: No AI Response

**Check:**
1. LM Studio is running (`http://192.168.1.37:1234`)
2. ORCHA backend is running (`http://localhost:8000`)
3. Model is loaded in LM Studio
4. Network connection between services

### Issue: No Sources with RAG

**Check:**
1. "Use RAG" checkbox is enabled
2. Documents are indexed in RAG system
3. Query is relevant to indexed documents
4. Backend RAG service is running

### Issue: Slow Responses

**Possible causes:**
- LM Studio model is large
- CPU-only inference (consider GPU)
- Network latency
- RAG search overhead

**Solutions:**
- Use smaller/faster model
- Enable GPU acceleration
- Optimize RAG index
- Add loading indicators

## Development

### Adding New Message Types

To add custom message types (e.g., "system"):

1. **Update Message type:**
```typescript
// src/types/orcha.d.ts
type: 'user' | 'assistant' | 'system' | 'error';
```

2. **Update MessageBubble:**
```typescript
// src/components/MessageBubble.tsx
const isSystem = message.type === 'system';
// Add styling logic
```

3. **Add translations if needed**

### Debugging API Calls

Enable detailed logging:

```typescript
// src/api/orcha.ts
console.log('Chat request:', payload);
console.log('Chat response:', response.data);
```

View in browser console (F12).

## Summary

✅ **Chat integration complete!**

- Real AI responses from LM Studio
- RAG document search with sources
- Bilingual UI (EN/FR)
- Error handling
- Source attribution
- Loading states
- Persistent chat history

The UI is now a fully functional AI chat interface! 🚀

---

**Last Updated:** October 17, 2025

