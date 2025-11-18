## OpenCare Chat Widget

This folder contains a lightweight iframe-based chat widget that external applications can embed to talk to the `POST /api/v1/orcha/chat-v2` endpoint. The widget mirrors the **Chat Widget Integration (chat-v2)** contract and exposes a single `OpenCareChat` global for external frontends.

### Folder structure

| File | Purpose |
| --- | --- |
| `widget.html` | Stand-alone UI that renders inside the iframe (glassmorphism styling, message list, composer). |
| `widget.js` | Logic for calling `/api/v1/orcha/chat-v2`, caching `conversation_id`, showing typing states, rendering contexts. |
| `embed.js` | Loader script that external apps include; it injects a floating launcher + iframe pointing to `widget.html`. |
| `README.md` | This guide, including integration snippets for partner teams. |

> Host these assets from the same origin as the main AURA UI bundle (e.g., `https://aura.vaeerdia.com/OpenCare/`).

---

## 1. Hosting the widget

1. Copy the `OpenCare/` folder to your static assets directory (or keep it inside this repo and expose it via your CDN).
2. Ensure `widget.html`, `widget.js`, and `embed.js` are publicly reachable, e.g.:
   - `https://aura.vaeerdia.com/OpenCare/widget.html`
   - `https://aura.vaeerdia.com/OpenCare/widget.js`
   - `https://aura.vaeerdia.com/OpenCare/embed.js`
3. The widget makes `fetch` calls to `${apiBaseUrl}/api/v1/orcha/chat-v2`. Configure CORS on the backend if the widget is hosted on another domain.

---

## 2. Embed script for partner apps

External applications only need to drop the loader script and call `OpenCareChat.init`.

```html
<script src="https://aura.vaeerdia.com/OpenCare/embed.js"></script>
<script>
  OpenCareChat.init({
    widgetUrl: 'https://aura.vaeerdia.com/OpenCare/widget.html',
    apiBaseUrl: 'https://aura.vaeerdia.com',
    tenantId: 'partner_xyz',
    userId: '42',                  // optional
    authToken: 'JWT_OR_CUSTOM',    // optional header for upstream auth
    useRag: false,                 // pass true to trigger contexts
    position: 'bottom-right'       // bottom-right | bottom-left | top-right | top-left
  });
</script>
```

### Runtime controls

`OpenCareChat` exposes a few helpers after `init`:

```js
OpenCareChat.open();
OpenCareChat.close();
OpenCareChat.toggle();
OpenCareChat.destroy();
```

These let host apps wire their own buttons or lifecycle hooks.

---

## 3. Widget configuration (query params)

`embed.js` automatically forwards the following query parameters to `widget.html`. If you self-host the iframe, you can add them manually:

| Param | Description |
| --- | --- |
| `apiBaseUrl` *(required)* | Base URL that serves `/api/v1/orcha/chat-v2`. |
| `tenantId` | Optional string to segment analytics downstream (maps to `tenant_id`). |
| `userId` | Optional numeric user (maps to `user_id`). Defaults to backend setting. |
| `authToken` | Optional bearer token; forwarded as `Authorization: Bearer <token>`. |
| `useRag` | `true/false`, toggles RAG contexts per backend contract. |
| `widgetId` | Internal identifier used for `sessionStorage` keys. |

Conversation IDs are cached in `sessionStorage` via `opencare-conversation-{tenantId}` so iframe reloads keep the thread intact.

---

## 4. How `widget.js` talks to the backend

```text
User types → widget.js POSTs to {apiBaseUrl}/api/v1/orcha/chat-v2
          → payload includes text, optional conversation_id/user_id/tenant_id/use_rag
          → response.data.text rendered to chat
          → response.data.conversation_id cached for next turn
          → response.data.contexts (if any) shown as a meta bubble
```

UI states covered:

- Send button disables and shows typing indicator while a request is in flight.
- Errors surface as inline meta bubbles (user can retry).
- Context snippets (when RAG triggers) appear as a compact list.

---

## 5. Styling / customisation

- `widget.html` uses inline CSS + Google Fonts (`Inter`). Feel free to replace with your own design system.
- The launcher button in `embed.js` uses glassy gradients and lives in any corner via `position`.
- If you need dark mode, duplicate `widget.html` and adjust the palette, then pass `widgetUrlDark` to the embed init or add a `theme` query param.

---

## 6. Local testing

1. Run the Vite dev server (`npm run dev`) so `OpenCare/widget.html` is served via Vite’s static middleware.
2. Open `http://localhost:5173/OpenCare/widget.html?apiBaseUrl=http://localhost:8000`.
3. Use the devtools console to simulate different params:

```js
window.location.href =
  '/OpenCare/widget.html?apiBaseUrl=http://localhost:8000&tenantId=dev&useRag=true';
```

4. To test the embed script locally, add the snippet to `public/index.html` (or any sandbox page) and set `widgetUrl` to the local file path.

---

## 7. Deployment checklist

- [ ] Upload `OpenCare/` assets to production CDN or static bucket.
- [ ] Double-check backend CORS to allow the host origin to call `/api/v1/orcha/chat-v2`.
- [ ] Provide partner teams with:
  - Embed snippet (Section 2).
  - API key/JWT instructions if their environment requires auth.
  - `tenantId` string they should pass for analytics.
- [ ] Monitor logs filtered by `tenant_id` to ensure partner usage is captured.

This setup lets any partner iframe the OpenCare chatbot and rely on a single backend endpoint for inference.

