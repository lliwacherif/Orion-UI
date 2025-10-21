# AURA - ORCHA Routing Demo UI

A modern, developer-friendly web interface for testing and demonstrating the ORCHA routing system. This ChatGPT-like UI communicates with the ORCHA routing endpoint to display routing decisions, recommended endpoints, and prepared payloads.

## 🎯 Project Overview

This application sends messages to the **ORCHA routing endpoint** (`/orcha/route`) and displays the routing decision in a chat interface. It does **not** automatically call downstream endpoints - instead, it shows developers what ORCHA recommends and provides a clear interface for understanding the routing logic.

### Key Features

- ✨ **Clean Chat Interface** - Modern, responsive design with message bubbles
- 🎯 **ORCHA Routing Display** - Clear visualization of routing decisions
- 📎 **File Attachments** - Support for images and PDFs
- 🔍 **RAG Toggle** - Enable/disable Retrieval-Augmented Generation
- 📋 **Payload Viewer** - Collapsible JSON viewer with copy functionality
- 🏷️ **Endpoint Badges** - Visual indicators for OCR, CHAT, RAG endpoints
- 💾 **Local Persistence** - Messages and session stored in localStorage
- 🔐 **Simple Session Management** - User/tenant ID authentication

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query (for API mutations)
- **HTTP Client**: Axios
- **Session Management**: React Context + localStorage

## 📋 Prerequisites

- Node.js 16+ and npm/yarn/pnpm
- A running ORCHA backend API (default: `http://localhost:8000/api/v1`)

## 🚀 Getting Started

### 1. Installation

```bash
# Install dependencies
npm install

# or
yarn install

# or
pnpm install
```

### 2. Environment Configuration

Create a `.env` file in the project root (see `.env.example`):

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Adjust `VITE_API_URL` to match your ORCHA backend endpoint.

### 3. Development

```bash
# Start development server
npm run dev

# or
yarn dev

# or
pnpm dev
```

The app will be available at `http://localhost:3000`.

### 4. Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── api/
│   └── orcha.ts                 # API client for ORCHA routing endpoint
├── components/
│   ├── AttachmentChip.tsx       # File attachment display component
│   ├── ChatWindow.tsx           # Main chat interface container
│   ├── Login.tsx                # User/tenant login form
│   ├── MessageBubble.tsx        # User/assistant message bubble
│   ├── MessageInput.tsx         # Message input with attachments and RAG toggle
│   ├── MessageList.tsx          # Message list with auto-scroll
│   └── RoutingMessage.tsx       # ORCHA routing decision display
├── context/
│   └── SessionContext.tsx       # Session management context
├── types/
│   └── orcha.d.ts              # TypeScript type definitions
├── App.tsx                      # Main app component
├── main.tsx                     # Application entry point
└── index.css                    # Global styles with Tailwind

```

## 🔌 API Integration

### ORCHA Route Endpoint

The application calls **only** the ORCHA routing endpoint:

```
POST ${VITE_API_URL}/orcha/route
```

**Request Payload:**

```typescript
{
  user_id: string;
  tenant_id?: string;
  message: string;
  attachments?: Array<{ uri: string; type: string }>;
  use_rag?: boolean;
}
```

**Response:**

```typescript
{
  endpoint: string;              // e.g., "/api/v1/orcha/ocr"
  reason: string;                // e.g., "attachments present"
  prepared_payload: object;      // Prepared payload for the endpoint
  status?: string;               // Optional status information
  ocr_queued?: boolean;         // OCR-specific status
  job_ids?: string[];           // Job IDs if applicable
}
```

### Headers

Each request includes:
- `Content-Type: application/json`
- `x-trace-id: <uuid>` (generated per request)

## 📝 How It Works

### 1. Login Flow

1. User enters `user_id` and optional `tenant_id`
2. Session is created with a unique `session_id` (UUID)
3. Session is stored in localStorage for persistence

### 2. Sending Messages

1. User types a message and optionally:
   - Attaches files (images/PDFs)
   - Enables RAG toggle
2. Message is displayed as a user bubble
3. Request is sent to `/orcha/route`
4. Loading indicator appears

### 3. Routing Response

1. ORCHA responds with routing decision
2. Routing message bubble is displayed showing:
   - Recommended endpoint
   - Routing reason
   - Prepared payload (collapsible JSON)
   - Status information (if present)
   - Endpoint badge (OCR/CHAT/RAG)
3. Optional "Call Recommended Endpoint" button (placeholder)

## 🔧 Extending the Application

### Implementing Real File Upload

Currently, file attachments use object URLs as placeholders. To implement real file uploads:

1. **Add Upload Endpoint** in `src/api/orcha.ts`:

```typescript
export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post<{ file_uri: string }>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data.file_uri;
};
```

2. **Update File Selection** in `src/components/MessageInput.tsx`:

Replace the TODO section in `handleFileSelect`:

```typescript
const uploadPromises = Array.from(files).map(async (file) => {
  const fileUri = await uploadFile(file);
  return { uri: fileUri, type: file.type };
});
const uploadedAttachments = await Promise.all(uploadPromises);
setAttachments((prev) => [...prev, ...uploadedAttachments]);
```

### Implementing Endpoint Calls

To enable the "Call Recommended Endpoint" button:

1. **Add Function** in `src/api/orcha.ts`:

```typescript
export const callRecommendedEndpoint = async (
  endpoint: string,
  payload: any
): Promise<any> => {
  const traceId = uuidv4();
  
  const response = await api.post(endpoint, payload, {
    headers: {
      'x-trace-id': traceId,
    },
  });
  
  return response.data;
};
```

2. **Update Handler** in `src/components/RoutingMessage.tsx`:

Replace the `handleCallEndpoint` function:

```typescript
const handleCallEndpoint = async () => {
  try {
    setIsLoading(true);
    const result = await callRecommendedEndpoint(endpoint, prepared_payload);
    // Handle result (e.g., display in a modal or new message)
    console.log('Endpoint result:', result);
  } catch (error) {
    console.error('Failed to call endpoint:', error);
    alert('Failed to call endpoint. Check console for details.');
  } finally {
    setIsLoading(false);
  }
};
```

### Adding New Message Types

To add support for new ORCHA endpoints or message types:

1. Update types in `src/types/orcha.d.ts`
2. Add badge logic in `src/components/RoutingMessage.tsx` (`getEndpointBadge` function)
3. Optionally create specialized payload viewers for different endpoint types

## 🎨 Customization

### Styling

The application uses Tailwind CSS. To customize:

- **Colors**: Modify color classes in components (e.g., `indigo-600` → `blue-600`)
- **Theme**: Edit `tailwind.config.js` to extend the default theme
- **Layout**: Adjust spacing, sizing in component files

### API Configuration

All API configuration is in `src/api/orcha.ts`:

- Base URL from environment variable
- Headers configuration
- Timeout and retry settings (via React Query)

## 🐛 Troubleshooting

### Connection Errors

If you see connection errors:

1. Verify ORCHA backend is running
2. Check `VITE_API_URL` in `.env` is correct
3. Ensure CORS is properly configured on the backend
4. Check browser console for detailed error messages

### TypeScript Errors

If you encounter TypeScript errors:

```bash
# Check for type errors
npx tsc --noEmit
```

### Build Issues

If the build fails:

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [React Query Documentation](https://tanstack.com/query/v3)

## 🤝 Contributing

This is a demo application. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is provided as-is for demonstration purposes.

---

**Built with ❤️ for testing ORCHA routing capabilities**
