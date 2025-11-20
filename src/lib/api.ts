const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

class ApiClient {
  private baseUrl = API_BASE_URL;
  private token: string | null = null;

  constructor() {
    this.updateToken();
  }
  
  private updateToken() {
    this.token = localStorage.getItem('auth_token');
    console.log('API Client token updated:', this.token ? 'Token present' : 'No token');
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Refresh token from localStorage before each request
    this.updateToken();
    
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      this.token = response.token;
      localStorage.setItem('auth_token', response.token);
    }
    
    return response;
  }

  async register(name: string, email: string, password: string, role = 'cashier') {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    
    if (response.token) {
      this.token = response.token;
      localStorage.setItem('auth_token', response.token);
    }
    
    return response;
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(profileData: { name?: string; email?: string }) {
    return this.request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.log('Logout API call failed, clearing local data anyway');
    } finally {
      this.token = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  // Customer methods
  async getCustomers(search?: string, limit = 50, offset = 0) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await this.request(`/customers${query}`);
    return response.customers || [];
  }

  async getCustomer(id: string) {
    return this.request(`/customers/${id}`);
  }

  async saveCustomer(customerData: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  }) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  async updateCustomer(id: string, customerData: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  }) {
    return this.request(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(customerData),
    });
  }

  // Order methods
  async createOrder(orderData: {
    customerId: string;
    items: Array<{
      name: string;
      price: number;
      quantity: number;
      notes?: string;
    }>;
    total: number;
    paymentMethod: string;
    cashPaymentDetails?: any;
    isExpress?: boolean;
    stains?: string[];
  }) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrders(params: {
    status?: string;
    customerId?: string;
    paymentMethod?: string;
    isExpress?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await this.request(`/orders${query}`);
    return response.orders || [];
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`);
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateOrder(orderId: string, updates: {
    status?: string;
    isExpress?: boolean;
    stains?: string[];
    paymentMethod?: string;
    cashPaymentDetails?: any;
    [key: string]: any;
  }) {
    // If updating status, use the status endpoint
    if (updates.status) {
      return this.updateOrderStatus(orderId, updates.status);
    }
    
    // Otherwise use the general update endpoint
    return this.request(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getOrderStats() {
    return this.request('/orders/stats/overview');
  }

  // User methods (admin only)
  async getUsers(search?: string, role?: string, limit = 50, offset = 0) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await this.request(`/users${query}`);
    return response.users || [];
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`);
  }

  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: {
    name?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
  }) {
    return this.request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  async deactivateUser(id: string) {
    return this.request(`/users/${id}/deactivate`, {
      method: 'PATCH',
    });
  }

  async activateUser(id: string) {
    return this.request(`/users/${id}/activate`, {
      method: 'PATCH',
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();
export default apiClient;