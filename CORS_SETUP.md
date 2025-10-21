# CORS Setup Guide

## Problem

When the frontend (`http://localhost:3000`) tries to communicate with the backend (`http://localhost:8000`), browsers enforce CORS (Cross-Origin Resource Sharing) policies. The backend was returning `405 Method Not Allowed` for OPTIONS preflight requests.

## Current Solution: Vite Proxy (Active)

I've configured Vite to proxy all `/api/*` requests to the backend. This means:

- Frontend requests to: `/api/v1/orcha/route`
- Are proxied to: `http://localhost:8000/api/v1/orcha/route`
- No CORS issues because the browser thinks it's the same origin

### Configuration Applied

**vite.config.ts:**
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
```

**.env:**
```
VITE_API_URL=/api/v1
```

## Permanent Solution: Backend CORS Configuration

For production or if you prefer not to use the proxy, configure CORS on your ORCHA backend.

### FastAPI Example

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Development frontend
        "https://yourdomain.com",  # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Your routes...
@app.post("/api/v1/orcha/route")
async def route_request(payload: RouteRequest):
    # Your logic
    pass
```

### Development-Only (Allow All)

For development only, you can temporarily allow all origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Development only!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## If Using Backend CORS Instead of Proxy

If you configure CORS on the backend and want to remove the Vite proxy:

1. **Update vite.config.ts** (remove proxy):
   ```typescript
   export default defineConfig({
     plugins: [react()],
     server: {
       port: 3000,
     },
   })
   ```

2. **Update .env** (use full URL):
   ```
   VITE_API_URL=http://localhost:8000/api/v1
   ```

3. **Restart Vite**:
   ```bash
   npm run dev
   ```

## Testing CORS

### Test 1: Check OPTIONS Request

```bash
curl -X OPTIONS http://localhost:8000/api/v1/orcha/route \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -v
```

**Expected response:**
- Status: 200 or 204 (not 405!)
- Headers: `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`

### Test 2: Check POST Request

```bash
curl -X POST http://localhost:8000/api/v1/orcha/route \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"user_id":"test","message":"hello"}' \
  -v
```

**Expected response:**
- Status: 200
- Headers: `Access-Control-Allow-Origin`
- Body: JSON routing response

## Troubleshooting

### Still Getting CORS Errors?

1. **Check backend logs** - Is it receiving the OPTIONS request?
2. **Restart both servers** - Frontend and backend
3. **Clear browser cache** - Ctrl+Shift+Delete
4. **Check browser console** - Look for specific CORS error messages

### 405 Method Not Allowed

- Backend doesn't have an OPTIONS handler
- Solution: Add CORS middleware or use Vite proxy

### No 'Access-Control-Allow-Origin' Header

- Backend isn't sending CORS headers
- Solution: Add CORS middleware

### Credentials Issues

If using cookies/auth:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,  # Important!
    # ...
)
```

Frontend:
```typescript
axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,  // Send cookies
})
```

## Production Considerations

### Security

1. **Never use `allow_origins=["*"]` in production**
2. **Explicitly list allowed origins**
3. **Restrict methods and headers** to what you actually need
4. **Use HTTPS** in production

### Example Production Setup

```python
# Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://app.yourdomain.com",
        "https://www.yourdomain.com",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["content-type", "x-trace-id"],
)
```

```env
# Frontend .env.production
VITE_API_URL=https://api.yourdomain.com/api/v1
```

## Current Status

✅ **Vite proxy is configured and active**

- Frontend uses relative paths (`/api/v1/...`)
- Vite proxies to backend (`http://localhost:8000`)
- No CORS issues in development

**To test:**
1. Open http://localhost:3000/
2. Login with a user ID
3. Send a message
4. Should work without CORS errors!

---

**Last Updated:** October 17, 2025

