const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'lead_manager_auth_token';
const USER_KEY = 'lead_manager_auth_user';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  getUser: () => {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clearUser: () => localStorage.removeItem(USER_KEY),
  clearAll: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = authStorage.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr) {
    // Network error or backend offline
    const error = new Error('Unable to connect to the server. Please check your internet connection or verify the backend is running.');
    error.status = 0;
    error.details = [];
    error.isNetworkError = true;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.details = data?.details || [];
    if (response.status === 401) {
      // Token invalid or expired
      authStorage.clearAll();
    }
    throw error;
  }

  return data;
}

export const api = {
  // Auth endpoints
  auth: {
    signup: async (credentials) => {
      const data = await request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (data.token) {
        authStorage.setToken(data.token);
        authStorage.setUser(data.user);
      }
      return data;
    },
    login: async (credentials) => {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (data.token) {
        authStorage.setToken(data.token);
        authStorage.setUser(data.user);
      }
      return data;
    },
    getMe: async () => {
      return request('/auth/me');
    },
    logout: () => {
      authStorage.clearAll();
    },
    getToken: authStorage.getToken,
    getUser: authStorage.getUser,
  },

  // Leads endpoints
  leads: {
    list: async (params = {}) => {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.set('search', params.search);
      if (params.status) searchParams.set('status', params.status);
      if (params.page) searchParams.set('page', params.page);
      if (params.limit) searchParams.set('limit', params.limit);
      if (params.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params.order) searchParams.set('order', params.order);

      const qs = searchParams.toString();
      const endpoint = qs ? `/leads?${qs}` : '/leads';
      return request(endpoint);
    },
    getById: async (id) => {
      return request(`/leads/${id}`);
    },
    create: async (leadData) => {
      return request('/leads', {
        method: 'POST',
        body: JSON.stringify(leadData),
      });
    },
    update: async (id, leadData) => {
      return request(`/leads/${id}`, {
        method: 'PUT',
        body: JSON.stringify(leadData),
      });
    },
    delete: async (id) => {
      return request(`/leads/${id}`, {
        method: 'DELETE',
      });
    },
    getStats: async () => {
      return request('/leads/stats');
    },
  },
};
