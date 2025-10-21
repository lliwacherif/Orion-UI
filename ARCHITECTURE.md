# Architecture Documentation

## Overview

This document describes the architecture of the AURA ORCHA Routing Demo UI.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │              React Application                    │  │
│  │                                                   │  │
│  │  ┌──────────────┐  ┌──────────────┐             │  │
│  │  │ SessionCtx   │  │ React Query  │             │  │
│  │  │ (Auth State) │  │ (API State)  │             │  │
│  │  └──────────────┘  └──────────────┘             │  │
│  │           │                │                     │  │
│  │  ┌────────▼────────────────▼──────────────────┐  │  │
│  │  │         Components Layer                   │  │  │
│  │  │  ┌─────────────────────────────────────┐   │  │  │
│  │  │  │  Login  │  ChatWindow  │  Messages  │   │  │  │
│  │  │  └─────────────────────────────────────┘   │  │  │
│  │  └────────────────────┬───────────────────────┘  │  │
│  │                       │                          │  │
│  │  ┌────────────────────▼───────────────────────┐  │  │
│  │  │          API Layer (orcha.ts)              │  │  │
│  │  │         Axios Client + UUID                │  │  │
│  │  └────────────────────┬───────────────────────┘  │  │
│  └───────────────────────┼───────────────────────────┘  │
└────────────────────────┼───────────────────────────────┘
                         │
                         │ HTTPS/HTTP
                         │
         ┌───────────────▼────────────────┐
         │   ORCHA Backend API            │
         │   POST /orcha/route            │
         │                                │
         │   ┌─────────────────────────┐  │
         │   │  Routing Logic          │  │
         │   │  - Chat Detection       │  │
         │   │  - OCR Detection        │  │
         │   │  - RAG Detection        │  │
         │   └─────────────────────────┘  │
         └────────────────────────────────┘
```

## Component Hierarchy

```
App (QueryClientProvider + SessionProvider)
│
├── Login (if not authenticated)
│   └── Form (user_id, tenant_id input)
│
└── ChatWindow (if authenticated)
    ├── Header (user info, logout button)
    ├── InfoBanner (API endpoint info)
    ├── MessageList
    │   ├── MessageBubble (user/assistant/error messages)
    │   │   └── AttachmentChip (file attachments)
    │   └── RoutingMessage (ORCHA routing decisions)
    │       ├── Endpoint badge
    │       ├── Reason display
    │       ├── Payload viewer (collapsible JSON)
    │       └── Call endpoint button (TODO)
    └── MessageInput
        ├── File attachment button
        ├── Textarea (auto-resizing)
        ├── RAG toggle checkbox
        └── Send button
```

## Data Flow

### 1. Authentication Flow

```
User Input (Login.tsx)
    │
    ├─> SessionContext.login()
    │       │
    │       ├─> Create session object (user_id, tenant_id, session_id)
    │       └─> Save to localStorage
    │
    └─> App renders ChatWindow
```

### 2. Message Send Flow

```
User types message + adds attachments + toggles RAG
    │
    └─> MessageInput.handleSendMessage()
            │
            ├─> Add user message to local state
            │   (displayed immediately)
            │
            └─> Trigger route mutation (React Query)
                    │
                    ├─> src/api/orcha.ts: route()
                    │       │
                    │       ├─> Generate x-trace-id (UUID)
                    │       ├─> POST /orcha/route
                    │       └─> Return RouteResponse
                    │
                    ├─> On Success:
                    │   └─> Add routing message to state
                    │       (displays endpoint, reason, payload)
                    │
                    └─> On Error:
                        └─> Add error message to state
```

### 3. State Management

#### Session State (React Context)

```typescript
interface Session {
  user_id: string;
  tenant_id?: string;
  session_id: string;
}
```

- Managed by `SessionContext`
- Persisted to `localStorage` (key: `aura_session`)
- Provides `login()` and `logout()` methods

#### Message State (Component State)

```typescript
interface Message {
  id: string;
  type: 'user' | 'assistant' | 'routing' | 'error';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  routingData?: RouteResponse;
}
```

- Managed in `ChatWindow` component
- Persisted to `localStorage` (key: `aura_messages`)
- Auto-loads on mount

#### API State (React Query)

```typescript
const routeMutation = useMutation(
  (payload: RouteRequest) => route(payload),
  {
    onSuccess: (data) => { /* Add routing message */ },
    onError: (error) => { /* Add error message */ }
  }
);
```

- Handles loading states
- Error handling
- Request deduplication

## Key Design Decisions

### 1. Single Endpoint Focus

**Decision:** Only call `/orcha/route`, don't automatically call downstream endpoints.

**Rationale:**
- Demo is for **routing visualization**, not full flow execution
- Prevents unintended side effects during testing
- Makes routing logic transparent to developers
- Allows manual control of downstream calls

### 2. Object URLs for Attachments

**Decision:** Use `URL.createObjectURL()` for file attachments (placeholder).

**Rationale:**
- Enables immediate UI testing without backend upload endpoint
- Clear TODO comments show how to implement real upload
- No backend dependencies during initial development
- Easy to replace with real upload later

### 3. localStorage Persistence

**Decision:** Store session and messages in `localStorage`.

**Rationale:**
- Survives page refreshes
- No backend session management needed for demo
- Simple implementation
- Easy to clear (logout, clear chat button)

### 4. React Query for API State

**Decision:** Use React Query instead of useState for API calls.

**Rationale:**
- Built-in loading states
- Error handling
- Request deduplication
- Retry logic
- Standard pattern for async state

## File Organization

```
src/
├── api/               # API client layer
│   └── orcha.ts      # Axios config, route() function, TODO helpers
├── components/        # React components
│   ├── Login.tsx          # Auth form
│   ├── ChatWindow.tsx     # Main container
│   ├── MessageList.tsx    # Message scroller
│   ├── MessageBubble.tsx  # User/assistant messages
│   ├── MessageInput.tsx   # Input with attachments
│   ├── AttachmentChip.tsx # File attachment display
│   └── RoutingMessage.tsx # ORCHA routing display
├── context/           # React context providers
│   └── SessionContext.tsx # Session management
├── types/             # TypeScript definitions
│   └── orcha.d.ts    # ORCHA API types
├── App.tsx           # Root component
├── main.tsx          # Entry point
└── index.css         # Tailwind + global styles
```

## API Contract

### Request Format

```typescript
POST /orcha/route

Headers:
  Content-Type: application/json
  x-trace-id: <uuid-v4>

Body:
{
  user_id: string;
  tenant_id?: string;
  message: string;
  attachments?: Array<{
    uri: string;
    type: string;  // MIME type
  }>;
  use_rag?: boolean;
}
```

### Response Format

```typescript
{
  endpoint: string;  // e.g., "/api/v1/orcha/ocr"
  reason: string;    // e.g., "attachments present"
  prepared_payload: {
    // Varies by endpoint type
    user_id: string;
    tenant_id?: string;
    // ... endpoint-specific fields
  };
  status?: string;
  ocr_queued?: boolean;
  job_ids?: string[];
}
```

## Extension Points

### 1. Adding Real File Upload

**Location:** `src/api/orcha.ts`, `src/components/MessageInput.tsx`

**Steps:**
1. Implement `uploadFile()` function in `orcha.ts`
2. Replace object URL logic in `MessageInput.tsx`
3. Handle upload progress/errors

### 2. Calling Recommended Endpoint

**Location:** `src/api/orcha.ts`, `src/components/RoutingMessage.tsx`

**Steps:**
1. Implement `callRecommendedEndpoint()` in `orcha.ts`
2. Update `handleCallEndpoint()` in `RoutingMessage.tsx`
3. Display results (new message or modal)

### 3. Adding Streaming Responses

**Location:** `src/api/orcha.ts`, `src/components/ChatWindow.tsx`

**Steps:**
1. Use EventSource or WebSocket for streaming
2. Update message state incrementally
3. Add loading/typing indicators

### 4. Multi-Session Support

**Location:** `src/context/SessionContext.tsx`

**Steps:**
1. Store multiple sessions in localStorage
2. Add session switcher UI
3. Filter messages by session

## Performance Considerations

### Message List Virtualization

For chat histories with 1000+ messages, consider:
- React Virtualized or react-window
- Lazy loading older messages
- Message pagination

### File Upload Optimization

For large files:
- Chunked uploads
- Progress indicators
- Upload cancellation
- Resumable uploads

### Bundle Size

Current bundle includes:
- React + ReactDOM: ~130 KB
- React Query: ~12 KB
- Axios: ~13 KB
- UUID: ~4 KB
- Tailwind (purged): ~10 KB

Total: ~170 KB (gzipped)

## Security Considerations

### Client-Side Only

This is a **demo UI** - not production-ready:

1. **No Authentication:** User ID is self-declared
2. **No Authorization:** No permission checks
3. **No Rate Limiting:** Client-side only
4. **localStorage Security:** Data accessible to all scripts

### Production Hardening

For production use:
1. Add JWT authentication
2. Implement CSRF protection
3. Add rate limiting
4. Use secure session storage (httpOnly cookies)
5. Sanitize user input
6. Add XSS protection

## Browser Support

Targets modern browsers with:
- ES2020+ features
- CSS Grid/Flexbox
- localStorage API
- Fetch/Axios
- File API
- Clipboard API

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

Potential additions:
- [ ] WebSocket for real-time updates
- [ ] Message search/filtering
- [ ] Export chat history
- [ ] Dark mode
- [ ] Markdown rendering in messages
- [ ] Code syntax highlighting
- [ ] Voice input
- [ ] Multi-language support

---

Last Updated: October 2025

