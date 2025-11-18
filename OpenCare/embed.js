(function () {
  const DEFAULTS = {
    widgetUrl: '/OpenCare/widget.html',
    apiBaseUrl: '',
    tenantId: '',
    userId: '',
    authToken: '',
    useRag: false,
    position: 'bottom-right',
    zIndex: 9999,
    widgetId: 'default',
  };

  const state = {
    initialized: false,
    open: false,
    elements: {},
    config: {},
  };

  function buildWidgetSrc(config) {
    const url = new URL(config.widgetUrl, window.location.origin);
    if (!config.apiBaseUrl) {
      console.warn('[OpenCareChat] apiBaseUrl is required.');
    }
    url.searchParams.set('apiBaseUrl', config.apiBaseUrl || window.location.origin);
    url.searchParams.set('widgetId', config.widgetId);
    if (config.tenantId) url.searchParams.set('tenantId', config.tenantId);
    if (config.userId) url.searchParams.set('userId', config.userId);
    if (config.authToken) url.searchParams.set('authToken', config.authToken);
    if (config.useRag) url.searchParams.set('useRag', 'true');
    return url.toString();
  }

  function applyPosition(container, position, zIndex) {
    container.style.position = 'fixed';
    container.style.zIndex = String(zIndex);
    container.style.width = '360px';
    container.style.maxWidth = '90vw';
    container.style.height = '540px';
    container.style.maxHeight = '90vh';
    container.style.border = 'none';
    container.style.transition = 'transform 200ms ease, opacity 200ms ease';
    container.style.opacity = '0';
    container.style.transformOrigin = 'bottom right';
    container.style.transform = 'scale(0.9)';

    if (position.includes('bottom')) {
      container.style.bottom = '24px';
    } else {
      container.style.top = '24px';
    }
    if (position.includes('right')) {
      container.style.right = '24px';
      container.style.transformOrigin = 'bottom right';
    } else {
      container.style.left = '24px';
      container.style.transformOrigin = 'bottom left';
    }
  }

  function createLauncher(position, zIndex) {
    const launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.innerHTML = `
      <span style="font-weight:600;">OpenCare</span>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18" />
      </svg>`;
    launcher.style.position = 'fixed';
    launcher.style.zIndex = String(zIndex);
    launcher.style.border = 'none';
    launcher.style.borderRadius = '999px';
    launcher.style.padding = '12px 20px';
    launcher.style.display = 'inline-flex';
    launcher.style.alignItems = 'center';
    launcher.style.gap = '10px';
    launcher.style.cursor = 'pointer';
    launcher.style.background =
      'linear-gradient(135deg, rgba(14,165,233,0.9), rgba(37,99,235,0.95))';
    launcher.style.color = '#fff';
    launcher.style.fontFamily = 'Inter, system-ui, -apple-system, sans-serif';
    launcher.style.fontSize = '15px';
    launcher.style.boxShadow = '0 15px 35px rgba(15,23,42,0.35)';

    if (position.includes('bottom')) {
      launcher.style.bottom = '24px';
    } else {
      launcher.style.top = '24px';
    }
    if (position.includes('right')) {
      launcher.style.right = '24px';
    } else {
      launcher.style.left = '24px';
    }

    launcher.addEventListener('click', () => OpenCareChat.toggle());
    return launcher;
  }

  function initElements(config) {
    const container = document.createElement('div');
    container.setAttribute('aria-hidden', 'true');
    applyPosition(container, config.position, config.zIndex);

    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'OpenCare Assistant');
    iframe.setAttribute('allow', 'clipboard-write; clipboard-read');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '18px';
    iframe.src = buildWidgetSrc(config);

    container.appendChild(iframe);

    const launcher = createLauncher(config.position, config.zIndex + 1);

    document.body.appendChild(container);
    document.body.appendChild(launcher);

    state.elements = { container, iframe, launcher };
  }

  function openWidget() {
    if (!state.elements.container) return;
    state.elements.container.style.opacity = '1';
    state.elements.container.style.transform = 'scale(1)';
    state.elements.container.setAttribute('aria-hidden', 'false');
    state.open = true;
  }

  function closeWidget() {
    if (!state.elements.container) return;
    state.elements.container.style.opacity = '0';
    state.elements.container.style.transform = 'scale(0.9)';
    state.elements.container.setAttribute('aria-hidden', 'true');
    state.open = false;
  }

  const OpenCareChat = {
    init(config = {}) {
      if (state.initialized) return;
      state.config = { ...DEFAULTS, ...config };
      if (!state.config.apiBaseUrl) {
        console.warn('[OpenCareChat] apiBaseUrl is recommended for production.');
      }
      initElements(state.config);
      state.initialized = true;
    },
    open() {
      openWidget();
    },
    close() {
      closeWidget();
    },
    toggle() {
      state.open ? closeWidget() : openWidget();
    },
    destroy() {
      Object.values(state.elements).forEach((el) => el?.remove());
      state.elements = {};
      state.initialized = false;
      state.open = false;
    },
  };

  window.OpenCareChat = OpenCareChat;
})();

