# Quick Start Guide

Get up and running with AURA ORCHA Routing Demo in 5 minutes!

## Prerequisites

- Node.js 16 or higher
- ORCHA backend running (default: http://localhost:8000/api/v1)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

> **Note**: Adjust the URL if your ORCHA backend is running on a different host/port.

### 3. Start Development Server

```bash
npm run dev
```

The application will open at `http://localhost:3000`.

## First Use

1. **Login Screen**
   - Enter a `user_id` (e.g., "test_user")
   - Optionally enter a `tenant_id`
   - Click "Continue"

2. **Chat Interface**
   - Type a message in the input field
   - Press Enter to send (Shift+Enter for new line)
   - See ORCHA's routing decision appear as a response

3. **Try Features**
   - **Attachments**: Click the 📎 button to attach images or PDFs
   - **RAG Toggle**: Enable "Use RAG" checkbox before sending
   - **Routing Details**: Click "Expand" on routing messages to see full payload
   - **Copy JSON**: Use the "Copy" button to copy prepared payloads

## What to Expect

### Sample Interaction

**You send:** "Hello, how are you?"

**ORCHA responds with:**
- **Recommended Endpoint:** `/api/v1/orcha/chat`
- **Reason:** "Simple text query without attachments"
- **Prepared Payload:** `{ user_id: "test_user", message: "Hello, how are you?" }`

**You send:** [Attach an image]

**ORCHA responds with:**
- **Recommended Endpoint:** `/api/v1/orcha/ocr`
- **Reason:** "Attachments present, OCR processing required"
- **Prepared Payload:** `{ user_id: "test_user", file_uri: "...", mode: "auto" }`

## Troubleshooting

### Cannot Connect to Backend

**Error:** Network Error or CORS error

**Solutions:**
1. Verify ORCHA backend is running: `curl http://localhost:8000/api/v1/health`
2. Check `.env` file has correct `VITE_API_URL`
3. Ensure CORS is enabled on your backend for `http://localhost:3000`

### Port Already in Use

**Error:** Port 3000 is already in use

**Solution:** Stop the conflicting process or change the port in `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001, // Change to any available port
  },
})
```

### Dependencies Not Installing

**Error:** npm install fails

**Solutions:**
1. Clear npm cache: `npm cache clean --force`
2. Delete `node_modules` and `package-lock.json`
3. Run `npm install` again

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Explore TODO comments in the code for extension points
- Customize styling in component files
- Implement file upload (see `src/api/orcha.ts`)

## Need Help?

Check these resources:
- Project structure in README.md
- TODO comments in source code
- Browser console for error details
- Network tab to inspect API calls

Happy routing! 🚀

