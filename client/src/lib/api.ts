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

const API_BASE = import.meta.env.VITE_API_BASE || "";

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE}/api${endpoint}`;
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
    const response = await fetch(`${API_BASE}/api/chat/message`, {
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

// Admin API
export const admin = {
  // Device management
  devices: {
    list: async () => {
      return apiRequest('/admin/devices');
    },

    create: async (deviceData: {
      id: string;
      name: string;
      type: string;
      ip: string;
    }) => {
      return apiRequest('/admin/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData),
      });
    },

    update: async (deviceId: string, deviceData: Partial<{
      name: string;
      type: string;
      ip: string;
      status: string;
    }>) => {
      return apiRequest(`/admin/devices/${deviceId}`, {
        method: 'PATCH',
        body: JSON.stringify(deviceData),
      });
    },

    delete: async (deviceId: string) => {
      return apiRequest(`/admin/devices/${deviceId}`, {
        method: 'DELETE',
      });
    }
  },

  // Service management
  services: {
    list: async () => {
      return apiRequest('/admin/services');
    },

    create: async (serviceData: {
      name: string;
      type: string;
      endpoint?: string;
      status?: string;
      config?: Record<string, any>;
    }) => {
      return apiRequest('/admin/services', {
        method: 'POST',
        body: JSON.stringify(serviceData),
      });
    },

    update: async (serviceId: string, serviceData: Partial<{
      name: string;
      type: string;
      endpoint: string;
      status: string;
      config: Record<string, any>;
    }>) => {
      return apiRequest(`/admin/services/${serviceId}`, {
        method: 'PATCH',
        body: JSON.stringify(serviceData),
      });
    },

    delete: async (serviceId: string) => {
      return apiRequest(`/admin/services/${serviceId}`, {
        method: 'DELETE',
      });
    }
  }
};