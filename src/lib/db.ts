// API-based database client for browser compatibility
// This is a compatibility layer - new code should use the REST API directly
import { getAuthHeaders } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// DEPRECATED: Use the REST API endpoints directly instead
// This is kept for backward compatibility during migration
export const db = {
  async query(text: string, params?: any[]) {
    const response = await fetch(`${API_URL}/api/query`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query: text, params: params ?? [] }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Query failed');
    }

    const data = await response.json();
    return { rows: data.rows, rowCount: data.rowCount };
  },
  
  connect: () => {
    console.warn('db.connect() is not available in browser');
    return Promise.resolve();
  },
  
  end: () => {
    console.warn('db.end() is not available in browser');
    return Promise.resolve();
  },
};

// REST API client for new endpoints
export const api = {
  // Tenant endpoints
  async getUserContext() {
    const response = await fetch(`${API_URL}/api/user/context`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user context');
    }
    return response.json();
  },
  
  async createTenant(data: any) {
    const response = await fetch(`${API_URL}/api/tenants`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create tenant');
    }
    return response.json();
  },
  
  async getTenantBySlug(slug: string) {
    const response = await fetch(`${API_URL}/api/tenants/by-slug/${slug}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get tenant');
    }
    return response.json();
  },
  
  async getTenantById(id: string) {
    const response = await fetch(`${API_URL}/api/tenants/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get tenant');
    }
    return response.json();
  },
  
  // Product endpoints
  async getProducts(tenantId: string) {
    const response = await fetch(`${API_URL}/api/tenants/${tenantId}/products`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get products');
    }
    return response.json();
  },
  
  async createProduct(tenantId: string, data: any) {
    const response = await fetch(`${API_URL}/api/tenants/${tenantId}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create product');
    }
    return response.json();
  },
  
  async updateProduct(tenantId: string, productId: string, data: any) {
    const response = await fetch(`${API_URL}/api/tenants/${tenantId}/products/${productId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update product');
    }
    return response.json();
  },
  
  async deleteProduct(tenantId: string, productId: string) {
    const response = await fetch(`${API_URL}/api/tenants/${tenantId}/products/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete product');
    }
    return response.json();
  },
  
  // Order endpoints
  async getOrders(tenantId: string) {
    const response = await fetch(`${API_URL}/api/tenants/${tenantId}/orders`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get orders');
    }
    return response.json();
  },
  
  async createOrder(tenantId: string, data: any) {
    const response = await fetch(`${API_URL}/api/tenants/${tenantId}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create order');
    }
    return response.json();
  },
  
  async getOrderItems(tenantId: string, orderId: string) {
    const response = await fetch(`${API_URL}/api/tenants/${tenantId}/orders/${orderId}/items`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get order items');
    }
    return response.json();
  },
  
  // Party endpoints
  async getParties(tenantId: string) {
    const response = await fetch(`${API_URL}/api/tenants/${tenantId}/parties`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get parties');
    }
    return response.json();
  },
  
  async createParty(tenantId: string, data: any) {
    const response = await fetch(`${API_URL}/api/tenants/${tenantId}/parties`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create party');
    }
    return response.json();
  },
  
  async updateParty(tenantId: string, partyId: string, data: any) {
    const response = await fetch(`${API_URL}/api/tenants/${tenantId}/parties/${partyId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update party');
    }
    return response.json();
  },
  
  async deleteParty(tenantId: string, partyId: string) {
    const response = await fetch(`${API_URL}/api/tenants/${tenantId}/parties/${partyId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete party');
    }
    return response.json();
  },
  
  // Account endpoints
  async getAccounts(tenantId: string) {
    const response = await fetch(`${API_URL}/api/tenants/${tenantId}/accounts`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get accounts');
    }
    return response.json();
  },
  
  async createAccount(tenantId: string, data: any) {
    const response = await fetch(`${API_URL}/api/tenants/${tenantId}/accounts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create account');
    }
    return response.json();
  },
  
  async updateAccount(tenantId: string, accountId: string, data: any) {
    const response = await fetch(`${API_URL}/api/tenants/${tenantId}/accounts/${accountId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update account');
    }
    return response.json();
  },
  
  async deleteAccount(tenantId: string, accountId: string) {
    const response = await fetch(`${API_URL}/api/tenants/${tenantId}/accounts/${accountId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete account');
    }
    return response.json();
  },

  async placeStorefrontOrder(slug: string, data: any) {
    const response = await fetch(`${API_URL}/api/storefront/${slug}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to place order');
    }
    return response.json();
  },

  async trackStorefrontOrder(slug: string, data: { order_number: string; phone: string }) {
    const response = await fetch(`${API_URL}/api/storefront/${slug}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to track order');
    }
    return response.json();
  },

  async logScanEvent(
    tenantId: string,
    data: {
      code?: string | null;
      status: "success" | "failure";
      source?: "camera" | "manual";
      device_id?: string | null;
      device_label?: string | null;
      error_message?: string | null;
    }
  ) {
    const response = await fetch(`${API_URL}/api/tenants/${tenantId}/scan-events`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to log scan event");
    }
    return response.json();
  },
};

export default db;
