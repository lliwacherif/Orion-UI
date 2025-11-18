const qs = new URLSearchParams(window.location.search);

const widgetId = qs.get('widgetId') || 'default';
const apiBaseUrl = (qs.get('apiBaseUrl') || window.origin).replace(/\/$/, '');
const authToken = qs.get('authToken') || '';
const tenantId = qs.get('tenantId') || '';
const userId = qs.get('userId') || '';
const useRag = qs.get('useRag') === 'true';

const conversationKey = `opencare-conversation-${tenantId || widgetId}`;
let conversationId = sessionStorage.getItem(conversationKey)
  ? Number(sessionStorage.getItem(conversationKey))
  : undefined;

const messagesEl = document.getElementById('messages');
const formEl = document.getElementById('message-form');
const inputEl = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const tenantLabel = document.getElementById('tenantLabel');

if (tenantLabel && tenantId) {
  tenantLabel.textContent = tenantId;
}

appendSystemMessage('How can I assist you today?');

let typingEl = null;

formEl.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = inputEl.value.trim();
  if (!text) return;

  appendMessage('user', text);
  inputEl.value = '';
  inputEl.style.height = 'auto';

  setLoading(true);
  showTypingIndicator();

  try {
    const payload = await sendMessage(text);
    if (payload.conversation_id) {
      conversationId = payload.conversation_id;
      sessionStorage.setItem(conversationKey, String(conversationId));
    }
    if (payload.text) {
      appendMessage('assistant', payload.text);
    }
    if (payload.contexts && payload.contexts.length) {
      appendContexts(payload.contexts);
    }
  } catch (error) {
    appendSystemMessage(error.message || 'Something went wrong. Please retry.');
  } finally {
    setLoading(false);
    removeTypingIndicator();
  }
});

function appendMessage(role, text) {
  const bubble = document.createElement('div');
  bubble.className = `message ${role === 'user' ? 'user' : 'assistant'}`;
  bubble.textContent = text;
  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendContexts(contexts) {
  const bubble = document.createElement('div');
  bubble.className = 'message meta';
  bubble.innerHTML = `<strong>Context used</strong><ul style="padding-left:18px;margin:8px 0 0 0;">${contexts
    .map((ctx) => `<li>${ctx.title || ctx.id || 'Context snippet'}</li>`)
    .join('')}</ul>`;
  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendSystemMessage(text) {
  const bubble = document.createElement('div');
  bubble.className = 'message meta';
  bubble.textContent = text;
  messagesEl.appendChild(bubble);
}

function showTypingIndicator() {
  removeTypingIndicator();
  typingEl = document.createElement('div');
  typingEl.className = 'message assistant';
  typingEl.innerHTML = `
    <div class="typing" aria-label="Assistant is typing">
      <span></span><span></span><span></span>
    </div>`;
  messagesEl.appendChild(typingEl);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeTypingIndicator() {
  if (typingEl && typingEl.parentNode) {
    typingEl.parentNode.removeChild(typingEl);
  }
  typingEl = null;
}

function setLoading(isLoading) {
  sendBtn.disabled = isLoading;
  inputEl.disabled = isLoading;
}

async function sendMessage(text) {
  const payload = {
    text,
    use_rag: useRag,
  };

  if (conversationId) payload.conversation_id = conversationId;
  if (tenantId) payload.tenant_id = tenantId;
  if (userId) payload.user_id = Number(userId);

  const response = await fetch(`${apiBaseUrl}/api/v1/orcha/chat-v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Network error while contacting OpenCare.');
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Chat failed');
  }

  return data.data;
}

