// API client for Independent Research edge AI platform
let sessionId: string | null = null;

export const setSessionId = (id: string | null) => {
  sessionId = id;
  if (id) {
    localStorage.setItem('ir-session', id);
  } else {
    localStorage.removeItem('ir-session');
  }
};

export const getSessionId = (): string | null => {
  if (!sessionId) {
    sessionId = localStorage.getItem('ir-session');
  }
  return sessionId;
};

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `/api${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const sessionId = getSessionId();
  if (sessionId) {
    headers['x-session-id'] = sessionId;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

// Authentication API
export const auth = {
  login: async (email: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setSessionId(response.sessionId);
    return response;
  },

  oidcLogin: async (provider: string) => {
    const response = await apiRequest('/auth/oidc-login', {
      method: 'POST',
      body: JSON.stringify({ provider }),
    });
    setSessionId(response.sessionId);
    return response;
  },

  logout: async () => {
    await apiRequest('/auth/logout', { method: 'POST' });
    setSessionId(null);
  }
};

// Device API
export const devices = {
  list: async () => {
    return apiRequest('/devices');
  },

  connect: async (deviceId: string) => {
    return apiRequest(`/devices/${deviceId}/connect`, {
      method: 'POST',
    });
  },

  disconnect: async (deviceId: string) => {
    return apiRequest(`/devices/${deviceId}/disconnect`, {
      method: 'POST',
    });
  },

  scan: async () => {
    return apiRequest('/devices/scan', {
      method: 'POST',
    });
  }
};

// Chat API
export const chat = {
  getMessages: async (deviceId?: string) => {
    const params = deviceId ? `?deviceId=${deviceId}` : '';
    return apiRequest(`/chat/messages${params}`);
  },

  sendMessage: async (message: string, images: File[] = [], deviceId?: string, debug = false) => {
    const formData = new FormData();
    formData.append('message', message);
    formData.append('debug', debug.toString());
    if (deviceId) {
      formData.append('deviceId', deviceId);
    }
    images.forEach(image => {
      formData.append('images', image);
    });

    const sessionId = getSessionId();
    const response = await fetch('/api/chat/message', {
      method: 'POST',
      headers: {
        ...(sessionId && { 'x-session-id': sessionId }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }
};