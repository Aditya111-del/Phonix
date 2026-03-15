const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => {
  const token = localStorage.getItem('token');
  console.log('[API] Token from localStorage:', token ? 'exists' : 'missing');
  return token;
};

// Auth API
export const authAPI = {
  register: async (email: string, password: string, name: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    return response.json();
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  googleLogin: async (email: string, name: string, picture: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, picture }),
    });
    return response.json();
  },
};

// Bots API
export const botsAPI = {
  getAll: async (filters?: { type?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);

    const response = await fetch(`${API_BASE_URL}/bots?${params}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/bots/${id}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return response.json();
  },

  download: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/bots/${id}/download`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return response.json();
  },
};

// Markets API
export const marketsAPI = {
  getQuote: async (symbol: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/markets/quote/${symbol}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  analyze: async (
    symbol: string,
    question: string,
    marketData: Record<string, unknown> | null,
    news: Array<Record<string, unknown>>
  ) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/markets/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        symbol,
        question,
        marketData,
        news,
      }),
    });
    return response.json();
  },

  deepAnalysis: async (symbol: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/markets/deep-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ symbol }),
    });
    return response.json();
  },

  getHistory: async (symbol: string, days: number = 30) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/markets/history/${symbol}?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  getTechnical: async (symbol: string, indicator: string = 'RSI') => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/markets/technical/${symbol}?indicator=${indicator}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  getSentiment: async (symbol: string, limit: number = 10) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/markets/sentiment/${symbol}?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  getGainers: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/markets/gainers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  getIntraday: async (symbol: string, interval: string = '5min') => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/markets/intraday/${symbol}?interval=${interval}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },
};
export const adminAPI = {
  getAllBots: async () => {
    const token = getToken();
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[API] Admin error:', response.status, error);
        return { success: false, error: error.error || 'Failed to load bots' };
      }

      return response.json();
    } catch (err) {
      console.error('[API] Admin request error:', err);
      throw err;
    }
  },

  uploadBot: async (formData: FormData) => {
    const token = getToken();
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[API] Upload error:', response.status, error);
        return { success: false, error: error.error || 'Upload failed' };
      }

      return response.json();
    } catch (err) {
      console.error('[API] Upload request error:', err);
      throw err;
    }
  },

  updateBotStatus: async (id: string, status: 'active' | 'pending' | 'inactive') => {
    const token = getToken();
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[API] Status update error:', response.status, error);
        return { success: false, error: error.error || 'Status update failed' };
      }

      return response.json();
    } catch (err) {
      console.error('[API] Status update request error:', err);
      throw err;
    }
  },

  deleteBot: async (id: string) => {
    const token = getToken();
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[API] Delete error:', response.status, error);
        return { success: false, error: error.error || 'Delete failed' };
      }

      return response.json();
    } catch (err) {
      console.error('[API] Delete request error:', err);
      throw err;
    }
  },
};
