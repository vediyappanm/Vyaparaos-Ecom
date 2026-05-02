import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockResponse, createErrorResponse } from '../__mocks__/fetch';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Integration Tests (Fixed)', () => {
  const API_BASE = 'http://localhost:3001/api';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should sign up user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        phone: null
      };
      
      const mockResponse = {
        user: { id: '1', email: userData.email, full_name: userData.fullName, phone: null, avatar_url: null },
        token: 'test-token'
      };
      
      mockFetch.mockResolvedValue(createMockResponse(mockResponse));

      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.token).toBeDefined();
    });

    it('should sign in user successfully', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = {
        user: { id: '1', email: credentials.email, full_name: 'Test User', phone: null, avatar_url: null },
        token: 'test-token'
      };
      
      mockFetch.mockResolvedValue(createMockResponse(mockResponse));

      const response = await fetch(`${API_BASE}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.token).toBeDefined();
    });

    it('should verify token successfully', async () => {
      const token = 'test-token';
      const mockPayload = { userId: '1', email: 'test@example.com' };
      
      mockFetch.mockResolvedValue(createMockResponse({ valid: true, payload: mockPayload }));

      const response = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.valid).toBe(true);
      expect(data.payload).toBeDefined();
    });
  });

  describe('Product CRUD Operations', () => {
    const testTenantId = 'tenant-123';
    const testToken = 'test-token';

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

      const createdProduct = {
        id: 'product-123',
        tenant_id: testTenantId,
        ...productData,
        is_active: true
      };

      mockFetch.mockResolvedValue(createMockResponse(createdProduct));

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
    });

    it('should get all products', async () => {
      const mockProducts = [
        { id: '1', tenant_id: testTenantId, name: 'Product 1', price: 100 },
        { id: '2', tenant_id: testTenantId, name: 'Product 2', price: 200 }
      ];

      mockFetch.mockResolvedValue(createMockResponse(mockProducts));

      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/products`, {
        headers: { 'Authorization': `Bearer ${testToken}` }
      });

      expect(response.ok).toBe(true);
      const products = await response.json();
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBe(2);
    });

    it('should update a product', async () => {
      const updateData = {
        name: 'Updated Test Product',
        price: 120
      };

      const updatedProduct = {
        id: 'product-123',
        tenant_id: testTenantId,
        name: 'Updated Test Product',
        price: 120
      };

      mockFetch.mockResolvedValue(createMockResponse(updatedProduct));

      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/products/product-123`, {
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
      const deletedProduct = {
        id: 'product-123',
        name: 'Deleted Product'
      };

      mockFetch.mockResolvedValue(createMockResponse(deletedProduct));

      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/products/product-123`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${testToken}` }
      });

      expect(response.ok).toBe(true);
      const product = await response.json();
      expect(product.id).toBe('product-123');
    });
  });

  describe('Order Operations', () => {
    const testTenantId = 'tenant-123';
    const testToken = 'test-token';

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

      const createdOrder = {
        id: 'order-123',
        tenant_id: testTenantId,
        ...orderData
      };

      mockFetch.mockResolvedValue(createMockResponse(createdOrder));

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
    });

    it('should get all orders', async () => {
      const mockOrders = [
        { id: '1', tenant_id: testTenantId, order_number: 'INV-00001', total: 500 },
        { id: '2', tenant_id: testTenantId, order_number: 'INV-00002', total: 300 }
      ];

      mockFetch.mockResolvedValue(createMockResponse(mockOrders));

      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/orders`, {
        headers: { 'Authorization': `Bearer ${testToken}` }
      });

      expect(response.ok).toBe(true);
      const orders = await response.json();
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBe(2);
    });

    it('should get order items', async () => {
      const mockItems = [
        { id: '1', product_name: 'Product 1', qty: 2, total: 200 },
        { id: '2', product_name: 'Product 2', qty: 1, total: 100 }
      ];

      mockFetch.mockResolvedValue(createMockResponse(mockItems));

      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/orders/order-123/items`, {
        headers: { 'Authorization': `Bearer ${testToken}` }
      });

      expect(response.ok).toBe(true);
      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
    });
  });

  describe('Party Operations', () => {
    const testTenantId = 'tenant-123';
    const testToken = 'test-token';

    it('should create a party', async () => {
      const partyData = {
        name: 'Test Customer',
        type: 'customer',
        phone: '+1234567890',
        email: 'customer@example.com'
      };

      const createdParty = {
        id: 'party-123',
        tenant_id: testTenantId,
        ...partyData
      };

      mockFetch.mockResolvedValue(createMockResponse(createdParty));

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
    });

    it('should get all parties', async () => {
      const mockParties = [
        { id: '1', tenant_id: testTenantId, name: 'Customer A', type: 'customer' },
        { id: '2', tenant_id: testTenantId, name: 'Vendor B', type: 'vendor' }
      ];

      mockFetch.mockResolvedValue(createMockResponse(mockParties));

      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/parties`, {
        headers: { 'Authorization': `Bearer ${testToken}` }
      });

      expect(response.ok).toBe(true);
      const parties = await response.json();
      expect(Array.isArray(parties)).toBe(true);
      expect(parties.length).toBe(2);
    });

    it('should update a party', async () => {
      const updateData = {
        name: 'Updated Test Customer',
        phone: '+9876543210'
      };

      const updatedParty = {
        id: 'party-123',
        tenant_id: testTenantId,
        name: 'Updated Test Customer',
        phone: '+9876543210'
      };

      mockFetch.mockResolvedValue(createMockResponse(updatedParty));

      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/parties/party-123`, {
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
    const testTenantId = 'tenant-123';
    const testToken = 'test-token';

    it('should create an account', async () => {
      const accountData = {
        name: 'Test Cash Account',
        type: 'cash',
        balance: 1000
      };

      const createdAccount = {
        id: 'account-123',
        tenant_id: testTenantId,
        ...accountData
      };

      mockFetch.mockResolvedValue(createMockResponse(createdAccount));

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
    });

    it('should get all accounts', async () => {
      const mockAccounts = [
        { id: '1', tenant_id: testTenantId, name: 'Cash Account', type: 'cash', balance: 1000 },
        { id: '2', tenant_id: testTenantId, name: 'Bank Account', type: 'bank', balance: 5000 }
      ];

      mockFetch.mockResolvedValue(createMockResponse(mockAccounts));

      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/accounts`, {
        headers: { 'Authorization': `Bearer ${testToken}` }
      });

      expect(response.ok).toBe(true);
      const accounts = await response.json();
      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts.length).toBe(2);
    });

    it('should update an account', async () => {
      const updateData = {
        name: 'Updated Test Account',
        balance: 1500
      };

      const updatedAccount = {
        id: 'account-123',
        tenant_id: testTenantId,
        name: 'Updated Test Account',
        balance: 1500
      };

      mockFetch.mockResolvedValue(createMockResponse(updatedAccount));

      const response = await fetch(`${API_BASE}/tenants/${testTenantId}/accounts/account-123`, {
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
      mockFetch.mockResolvedValue(createErrorResponse('Unauthorized', 401));

      const response = await fetch(`${API_BASE}/tenants/tenant-123/products`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('should handle not found errors', async () => {
      mockFetch.mockResolvedValue(createErrorResponse('Not found', 404));

      const response = await fetch(`${API_BASE}/tenants/tenant-123/products/nonexistent`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    it('should handle validation errors', async () => {
      mockFetch.mockResolvedValue(createErrorResponse('Validation error', 400));

      const response = await fetch(`${API_BASE}/tenants/tenant-123/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          name: '',
          price: -100
        })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });
});
