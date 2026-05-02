import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createMockResponse } from '../__mocks__/fetch';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Integration Tests', () => {
  const API_BASE = 'http://localhost:3001/api';
  let testToken: string;
  let testTenantId: string;
  let testProductId: string;
  let testOrderId: string;
  let testPartyId: string;
  let testAccountId: string;

  beforeAll(async () => {
    // Setup test user and tenant
    const signupResponse = {
      user: { id: 'test-user-1', email: 'test@example.com', full_name: 'Test User', phone: null, avatar_url: null },
      token: 'test-token-123'
    };
    
    const tenantResponse = {
      id: 'test-tenant-1',
      name: 'Test Store',
      slug: 'test-store',
      user_id: 'test-user-1'
    };

    mockFetch.mockImplementation((url: string, options?: any) => {
      if (url.includes('/auth/signup')) {
        return Promise.resolve(createMockResponse(signupResponse));
      }
      if (url.includes('/auth/signin')) {
        return Promise.resolve(createMockResponse(signupResponse));
      }
      if (url.includes('/tenants') && options?.method === 'POST') {
        return Promise.resolve(createMockResponse(tenantResponse));
      }
      if (url.includes('/tenants/test-tenant-1/products') && options?.method === 'POST') {
        const product = JSON.parse(options.body);
        return Promise.resolve(createMockResponse({
          id: 'test-product-1',
          tenant_id: 'test-tenant-1',
          ...product,
          is_active: true
        }));
      }
      if (url.includes('/tenants/test-tenant-1/products') && !options?.method) {
        return Promise.resolve(createMockResponse([
          {
            id: 'test-product-1',
            tenant_id: 'test-tenant-1',
            name: 'Test Product',
            price: 100,
            is_active: true
          }
        ]));
      }
      if (url.includes('/tenants/test-tenant-1/orders') && options?.method === 'POST') {
        const order = JSON.parse(options.body);
        return Promise.resolve(createMockResponse({
          id: 'test-order-1',
          tenant_id: 'test-tenant-1',
          ...order
        }));
      }
      if (url.includes('/tenants/test-tenant-1/orders') && !options?.method) {
        return Promise.resolve(createMockResponse([
          {
            id: 'test-order-1',
            tenant_id: 'test-tenant-1',
            order_number: 'INV-00001',
            total: 500
          }
        ]));
      }
      if (url.includes('/tenants/test-tenant-1/parties') && options?.method === 'POST') {
        const party = JSON.parse(options.body);
        return Promise.resolve(createMockResponse({
          id: 'test-party-1',
          tenant_id: 'test-tenant-1',
          ...party
        }));
      }
      if (url.includes('/tenants/test-tenant-1/parties') && !options?.method) {
        return Promise.resolve(createMockResponse([
          {
            id: 'test-party-1',
            tenant_id: 'test-tenant-1',
            name: 'Test Customer',
            type: 'customer'
          }
        ]));
      }
      if (url.includes('/tenants/test-tenant-1/accounts') && options?.method === 'POST') {
        const account = JSON.parse(options.body);
        return Promise.resolve(createMockResponse({
          id: 'test-account-1',
          tenant_id: 'test-tenant-1',
          ...account
        }));
      }
      if (url.includes('/tenants/test-tenant-1/accounts') && !options?.method) {
        return Promise.resolve(createMockResponse([
          {
            id: 'test-account-1',
            tenant_id: 'test-tenant-1',
            name: 'Cash Account',
            type: 'cash',
            balance: 1000
          }
        ]));
      }
      
      return Promise.resolve(createMockResponse({ status: 'ok' }));
    });

    // Sign up and create tenant
    const signupResult = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        phone: null
      })
    });
    
    const signupData = await signupResult.json();
    testToken = signupData.token;

    const tenantResult = await fetch(`${API_BASE}/tenants`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify({
        name: 'Test Store',
        slug: 'test-store'
      })
    });
    
    const tenantData = await tenantResult.json();
    testTenantId = tenantData.id;
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should sign up user successfully', async () => {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'password123',
          fullName: 'New User',
          phone: null
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.token).toBeDefined();
    });

    it('should sign in user successfully', async () => {
      const response = await fetch(`${API_BASE}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.token).toBeDefined();
    });

    it('should verify token successfully', async () => {
      const response = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: testToken })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.valid).toBe(true);
      expect(data.payload).toBeDefined();
    });
  });

  describe('Product CRUD Operations', () => {
    it('should create a product', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product',
        price: 100,
        cost_price: 80,
        tax_rate: 0.1,
        stock_qty: 50,
        unit: 'piece'
      };

      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        },
        body: JSON.stringify(productData)
      });

      expect(response.ok).toBe(true);
      const product = await response.json();
      expect(product.name).toBe(productData.name);
      expect(product.price).toBe(productData.price);
      testProductId = product.id;
    });

    it('should get all products', async () => {
      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/products`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });

      expect(response.ok).toBe(true);
      const products = await response.json();
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
    });

    it('should update a product', async () => {
      const updateData = {
        name: 'Updated Test Product',
        price: 120
      };

      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/products/${testProductId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        },
        body: JSON.stringify(updateData)
      });

      expect(response.ok).toBe(true);
      const product = await response.json();
      expect(product.name).toBe(updateData.name);
      expect(product.price).toBe(updateData.price);
    });

    it('should delete a product', async () => {
      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/products/${testProductId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });

      expect(response.ok).toBe(true);
      const product = await response.json();
      expect(product.id).toBe(testProductId);
    });
  });

  describe('Order Operations', () => {
    it('should create an order', async () => {
      const orderData = {
        order_number: 'INV-00001',
        party_name: 'Test Customer',
        party_phone: '+1234567890',
        channel: 'walk-in',
        payment_mode: 'cash',
        subtotal: 500,
        discount: 0,
        tax_amount: 50,
        total: 550,
        paid_amount: 550,
        balance_due: 0,
        items: [
          {
            product_name: 'Test Item',
            qty: 1,
            unit_price: 550,
            total: 550
          }
        ]
      };

      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        },
        body: JSON.stringify(orderData)
      });

      expect(response.ok).toBe(true);
      const order = await response.json();
      expect(order.order_number).toBe(orderData.order_number);
      expect(order.total).toBe(orderData.total);
      testOrderId = order.id;
    });

    it('should get all orders', async () => {
      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/orders`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });

      expect(response.ok).toBe(true);
      const orders = await response.json();
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
    });

    it('should get order items', async () => {
      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/orders/${testOrderId}/items`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });

      expect(response.ok).toBe(true);
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
    });
  });

  describe('Party Operations', () => {
    it('should create a party', async () => {
      const partyData = {
        name: 'Test Customer',
        type: 'customer',
        phone: '+1234567890',
        email: 'customer@example.com'
      };

      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/parties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        },
        body: JSON.stringify(partyData)
      });

      expect(response.ok).toBe(true);
      const party = await response.json();
      expect(party.name).toBe(partyData.name);
      expect(party.type).toBe(partyData.type);
      testPartyId = party.id;
    });

    it('should get all parties', async () => {
      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/parties`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });

      expect(response.ok).toBe(true);
      const parties = await response.json();
      expect(Array.isArray(parties)).toBe(true);
      expect(parties.length).toBeGreaterThan(0);
    });

    it('should update a party', async () => {
      const updateData = {
        name: 'Updated Test Customer',
        phone: '+9876543210'
      };

      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/parties/${testPartyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        },
        body: JSON.stringify(updateData)
      });

      expect(response.ok).toBe(true);
      const party = await response.json();
      expect(party.name).toBe(updateData.name);
      expect(party.phone).toBe(updateData.phone);
    });
  });

  describe('Account Operations', () => {
    it('should create an account', async () => {
      const accountData = {
        name: 'Test Cash Account',
        type: 'cash',
        balance: 1000
      };

      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        },
        body: JSON.stringify(accountData)
      });

      expect(response.ok).toBe(true);
      const account = await response.json();
      expect(account.name).toBe(accountData.name);
      expect(account.type).toBe(accountData.type);
      testAccountId = account.id;
    });

    it('should get all accounts', async () => {
      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/accounts`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });

      expect(response.ok).toBe(true);
      const accounts = await response.json();
      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts.length).toBeGreaterThan(0);
    });

    it('should update an account', async () => {
      const updateData = {
        name: 'Updated Test Account',
        balance: 1500
      };

      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/accounts/${testAccountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        },
        body: JSON.stringify(updateData)
      });

      expect(response.ok).toBe(true);
      const account = await response.json();
      expect(account.name).toBe(updateData.name);
      expect(account.balance).toBe(updateData.balance);
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized requests', async () => {
      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/products`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('should handle not found errors', async () => {
      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/products/nonexistent`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    it('should handle validation errors', async () => {
      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        },
        body: JSON.stringify({
          // Missing required fields
          name: '',
          price: -100
        })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });
});
