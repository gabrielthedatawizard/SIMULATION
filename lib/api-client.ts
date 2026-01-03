const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch {
        // If JSON parsing fails, use status text
      }
      
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).response = { data: { message: errorMessage } };
      throw error;
    }

    return response.json();
  }

  // Auth
  async register(data: {
    email?: string;
    phone?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  }) {
    return this.request<{ accessToken: string; refreshToken: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email?: string; phone?: string; password?: string }) {
    return this.request<{ accessToken: string; refreshToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Organizations
  async createOrganization(data: { name: string; slug: string; description?: string }) {
    return this.request('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyOrganizations() {
    return this.request('/organizations/my');
  }

  async getOrganization(id: string) {
    return this.request(`/organizations/${id}`);
  }

  // Events
  async createEvent(organizationId: string, data: {
    type: string;
    name: string;
    payload: any;
    source?: string;
  }) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify({ ...data, organizationId }),
    });
  }

  async getEvents(organizationId: string) {
    return this.request(`/events?organizationId=${organizationId}`);
  }

  // Workflows
  async createWorkflow(organizationId: string, data: {
    name: string;
    description?: string;
    triggerEventType?: string;
    triggerCondition?: any;
    steps: any[];
  }) {
    return this.request('/workflows', {
      method: 'POST',
      body: JSON.stringify({ ...data, organizationId }),
    });
  }

  async getWorkflows(organizationId: string) {
    return this.request(`/workflows?organizationId=${organizationId}`);
  }

  async getWorkflow(id: string) {
    return this.request(`/workflows/${id}`);
  }

  // Admin APIs
  async getAdminUsers(page = 1, limit = 50): Promise<{ users: any[]; pagination: any }> {
    return this.request<{ users: any[]; pagination: any }>(`/admin/users?page=${page}&limit=${limit}`);
  }

  async updateUserStatus(userId: string, action: 'enable' | 'disable') {
    return this.patch(`/admin/users/${userId}/status?action=${action}`);
  }

  async getAdminAnalytics(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString();
    return this.request(`/admin/analytics${query ? `?${query}` : ''}`);
  }

  async getAdminAIUsage(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString();
    return this.request(`/admin/ai-usage${query ? `?${query}` : ''}`);
  }

  async getAdminAutomations() {
    return this.request('/admin/automations');
  }

  async getAdminLogs(filters?: {
    entityType?: string;
    action?: string;
    userId?: string;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.entityType) params.append('entityType', filters.entityType);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    const query = params.toString();
    return this.request(`/admin/logs${query ? `?${query}` : ''}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

