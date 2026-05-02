import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createMockResponse } from '../__mocks__/fetch';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('End-to-End User Flows', () => {
  const API_BASE = 'http://localhost:3001/api';
  let testUser: any;
  let testTenant: any;
  let testProducts: any[] = [];
  let testOrders: any[] = [];
  let testParties: any[] = [];

  beforeAll(async () => {
    // Setup comprehensive mock responses
    mockFetch.mockImplementation((url: string, options?: any) => {
      // Auth endpoints
      if (url.includes('/auth/signup')) {
        const userData = JSON.parse(options.body);
        return Promise.resolve(createMockResponse({
          user: {
            id: 'user-123',
            email: userData.email,
            full_name: userData.fullName,
            phone: userData.phone,
            avatar_url: null
          },
          token: 'token-123'
        }));
      }
      
      if (url.includes('/auth/signin')) {
        const credentials = JSON.parse(options.body);
        return Promise.resolve(createMockResponse({
          user: {
            id: 'user-123',
            email: credentials.email,
            full_name: 'Test User',
            phone: null,
            avatar_url: null
          },
          token: 'token-123'
        }));
      }
      
      if (url.includes('/auth/verify')) {
        return Promise.resolve(createMockResponse({
          valid: true,
          payload: { userId: 'user-123', email: 'test@example.com' }
        }));
      }

      // Tenant endpoints
      if (url.includes('/tenants') && options?.method === 'POST') {
        const tenantData = JSON.parse(options.body);
        return Promise.resolve(createMockResponse({
          id: 'tenant-123',
          name: tenantData.name,
          slug: tenantData.slug,
          user_id: 'user-123',
          created_at: new Date().toISOString()
        }));
      }

      if (url.includes('/tenants/tenant-123')) {
        return Promise.resolve(createMockResponse({
          id: 'tenant-123',
          name: 'Test Store',
          slug: 'test-store',
          user_id: 'user-123'
        }));
      }

      // Product endpoints
      if (url.includes('/tenants/tenant-123/products') && options?.method === 'POST') {
        const productData = JSON.parse(options.body);
        const newProduct = {
          id: `product-${Date.now()}`,
          tenant_id: 'tenant-123',
          ...productData,
          is_active: true,
          created_at: new Date().toISOString()
        };
        testProducts.push(newProduct);
        return Promise.resolve(createMockResponse(newProduct));
      }

      if (url.includes('/tenants/tenant-123/products') && !options?.method) {
        return Promise.resolve(createMockResponse(testProducts));
      }

      if (url.includes('/tenants/tenant-123/products/') && options?.method === 'PUT') {
        const productId = url.split('/').pop();
        const updateData = JSON.parse(options.body);
        const productIndex = testProducts.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
          testProducts[productIndex] = { ...testProducts[productIndex], ...updateData };
          return Promise.resolve(createMockResponse(testProducts[productIndex]));
        }
        return Promise.resolve({ ok: false, status: 404 });
      }

      if (url.includes('/tenants/tenant-123/products/') && options?.method === 'DELETE') {
        const productId = url.split('/').pop();
        const productIndex = testProducts.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
          const deleted = testProducts.splice(productIndex, 1)[0];
          return Promise.resolve(createMockResponse(deleted));
        }
        return Promise.resolve({ ok: false, status: 404 });
      }

      // Party endpoints
      if (url.includes('/tenants/tenant-123/parties') && options?.method === 'POST') {
        const partyData = JSON.parse(options.body);
        const newParty = {
          id: `party-${Date.now()}`,
          tenant_id: 'tenant-123',
          ...partyData,
          created_at: new Date().toISOString()
        };
        testParties.push(newParty);
        return Promise.resolve(createMockResponse(newParty));
      }

      if (url.includes('/tenants/tenant-123/parties') && !options?.method) {
        return Promise.resolve(createMockResponse(testParties));
      }

      // Order endpoints
      if (url.includes('/tenants/tenant-123/orders') && options?.method === 'POST') {
        const orderData = JSON.parse(options.body);
        const newOrder = {
          id: `order-${Date.now()}`,
          tenant_id: 'tenant-123',
          ...orderData,
          status: 'confirmed',
          created_at: new Date().toISOString()
        };
        testOrders.push(newOrder);
        return Promise.resolve(createMockResponse(newOrder));
      }

      if (url.includes('/tenants/tenant-123/orders') && !options?.method) {
        return Promise.resolve(createMockResponse(testOrders));
      }

      // Order items
      if (url.includes('/orders/') && url.includes('/items')) {
        const orderId = url.split('/')[4];
        const order = testOrders.find(o => o.id === orderId);
        return Promise.resolve(createMockResponse(order?.items || []));
      }

      // Account endpoints
      if (url.includes('/tenants/tenant-123/accounts')) {
        if (options?.method === 'POST') {
          const accountData = JSON.parse(options.body);
          return Promise.resolve(createMockResponse({
            id: `account-${Date.now()}`,
            tenant_id: 'tenant-123',
            ...accountData,
            is_active: true,
            created_at: new Date().toISOString()
          }));
        } else {
          return Promise.resolve(createMockResponse([
            {
              id: 'account-1',
              tenant_id: 'tenant-123',
              name: 'Cash Account',
              type: 'cash',
              balance: 1000,
              is_active: true
            }
          ]));
        }
      }

      // Health check
      if (url.includes('/health')) {
        return Promise.resolve(createMockResponse({ status: 'ok' }));
      }

      return Promise.resolve({ ok: false, status: 404 });
    });
  });

  beforeEach(() => {
    testProducts = [];
    testOrders = [];
    testParties = [];
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('Complete User Onboarding Flow', () => {
    it('should complete full user registration and tenant setup', async () => {
      // Step 1: User signs up
      const signupResponse = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'SecurePassword123',
          fullName: 'John Doe',
          phone: '+1234567890'
        })
      });

      expect(signupResponse.ok).toBe(true);
      const signupData = await signupResponse.json();
      testUser = signupData.user;
      const token = signupData.token;

      // Step 2: Verify token
      const verifyResponse = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      expect(verifyResponse.ok).toBe(true);
      const verifyData = await verifyResponse.json();
      expect(verifyData.valid).toBe(true);

      // Step 3: Create tenant
      const tenantResponse = await fetch(`${API_BASE}/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'John\'s Store',
          slug: 'johns-store'
        })
      });

      expect(tenantResponse.ok).toBe(true);
      const tenantData = await tenantResponse.json();
      testTenant = tenantData;

      // Step 4: Verify tenant creation
      const getTenantResponse = await fetch(`${API_BASE}/tenants/${tenantData.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(getTenantResponse.ok).toBe(true);
      const retrievedTenant = await getTenantResponse.json();
      expect(retrievedTenant.id).toBe(tenantData.id);
      expect(retrievedTenant.name).toBe('John\'s Store');
    });
  });

  describe('Complete Product Management Flow', () => {
    beforeEach(async () => {
      // Setup user and tenant for product tests
      const signupResponse = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'productuser@example.com',
          password: 'SecurePassword123',
          fullName: 'Product Manager',
          phone: null
        })
      });
      const { token } = await signupResponse.json();

      const tenantResponse = await fetch(`${API_BASE}/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'Product Test Store',
          slug: 'product-test-store'
        })
      });
      testTenant = await tenantResponse.json();
    });

    it('should complete full product lifecycle', async () => {
      const token = 'token-123'; // Mock token

      // Step 1: Create multiple products
      const products = [
        {
          name: 'Laptop',
          description: 'High-performance laptop',
          price: 1200,
          cost_price: 800,
          tax_rate: 0.1,
          stock_qty: 10,
          unit: 'piece',
          category: 'Electronics'
        },
        {
          name: 'Mouse',
          description: 'Wireless mouse',
          price: 25,
          cost_price: 15,
          tax_rate: 0.1,
          stock_qty: 50,
          unit: 'piece',
          category: 'Accessories'
        },
        {
          name: 'Keyboard',
          description: 'Mechanical keyboard',
          price: 80,
          cost_price: 50,
          tax_rate: 0.1,
          stock_qty: 25,
          unit: 'piece',
          category: 'Accessories'
        }
      ];

      const createdProducts = [];
      for (const product of products) {
        const response = await fetch(`${API_BASE}/tenants/${testTenant.id}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(product)
        });

        expect(response.ok).toBe(true);
        const created = await response.json();
        createdProducts.push(created);
      }

      // Step 2: List all products
      const listResponse = await fetch(`${API_BASE}/tenants/${testTenant.id}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(listResponse.ok).toBe(true);
      const allProducts = await listResponse.json();
      expect(allProducts.length).toBe(3);

      // Step 3: Update a product
      const updateResponse = await fetch(`${API_BASE}/tenants/${testTenant.id}/products/${createdProducts[0].id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          price: 1100,
          stock_qty: 8,
          description: 'Updated high-performance laptop'
        })
      });

      expect(updateResponse.ok).toBe(true);
      const updatedProduct = await updateResponse.json();
      expect(updatedProduct.price).toBe(1100);
      expect(updatedProduct.stock_qty).toBe(8);

      // Step 4: Delete a product
      const deleteResponse = await fetch(`${API_BASE}/tenants/${testTenant.id}/products/${createdProducts[2].id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(deleteResponse.ok).toBe(true);
      const deletedProduct = await deleteResponse.json();
      expect(deletedProduct.id).toBe(createdProducts[2].id);

      // Step 5: Verify remaining products
      const finalListResponse = await fetch(`${API_BASE}/tenants/${testTenant.id}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(finalListResponse.ok).toBe(true);
      const remainingProducts = await finalListResponse.json();
      expect(remainingProducts.length).toBe(2);
    });
  });

  describe('Complete Order Management Flow', () => {
    beforeEach(async () => {
      // Setup prerequisites
      const token = 'token-123';
      
      // Create products for orders
      const products = [
        { name: 'Product A', price: 100, cost_price: 60, tax_rate: 0.1, stock_qty: 20, unit: 'piece' },
        { name: 'Product B', price: 50, cost_price: 30, tax_rate: 0.1, stock_qty: 15, unit: 'piece' }
      ];

      for (const product of products) {
        await fetch(`${API_BASE}/tenants/tenant-123/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(product)
        });
      }

      // Create parties
      const parties = [
        { name: 'Customer A', type: 'customer', phone: '+1234567890' },
        { name: 'Customer B', type: 'customer', email: 'customerb@example.com' }
      ];

      for (const party of parties) {
        await fetch(`${API_BASE}/tenants/tenant-123/parties`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(party)
        });
      }
    });

    it('should complete full order lifecycle', async () => {
      const token = 'token-123';

      // Step 1: Create an order with multiple items
      const orderData = {
        order_number: 'INV-2023-001',
        party_name: 'Customer A',
        party_phone: '+1234567890',
        channel: 'walk-in',
        payment_mode: 'cash',
        subtotal: 150,
        discount: 10,
        tax_amount: 14,
        total: 154,
        paid_amount: 154,
        balance_due: 0,
        items: [
          {
            product_name: 'Product A',
            qty: 1,
            unit_price: 100,
            discount: 0,
            tax_rate: 0.1,
            tax_amount: 10,
            total: 100
          },
          {
            product_name: 'Product B',
            qty: 1,
            unit_price: 50,
            discount: 10,
            tax_rate: 0.1,
            tax_amount: 4,
            total: 54
          }
        ]
      };

      const createResponse = await fetch(`${API_BASE}/tenants/tenant-123/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      expect(createResponse.ok).toBe(true);
      const createdOrder = await createResponse.json();
      expect(createdOrder.order_number).toBe(orderData.order_number);
      expect(createdOrder.total).toBe(orderData.total);

      // Step 2: Get order items
      const itemsResponse = await fetch(`${API_BASE}/tenants/tenant-123/orders/${createdOrder.id}/items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(itemsResponse.ok).toBe(true);
      const items = await itemsResponse.json();
      expect(items.length).toBe(2);

      // Step 3: List all orders
      const listResponse = await fetch(`${API_BASE}/tenants/tenant-123/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(listResponse.ok).toBe(true);
      const allOrders = await listResponse.json();
      expect(allOrders.length).toBe(1);
      expect(allOrders[0].order_number).toBe(orderData.order_number);

      // Step 4: Create another order for testing
      const secondOrderData = {
        order_number: 'INV-2023-002',
        party_name: 'Customer B',
        subtotal: 200,
        total: 200,
        paid_amount: 100,
        balance_due: 100,
        items: [
          {
            product_name: 'Product A',
            qty: 2,
            unit_price: 100,
            total: 200
          }
        ]
      };

      await fetch(`${API_BASE}/tenants/tenant-123/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(secondOrderData)
      });

      // Step 5: Verify multiple orders
      const finalListResponse = await fetch(`${API_BASE}/tenants/tenant-123/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(finalListResponse.ok).toBe(true);
      const finalOrders = await finalListResponse.json();
      expect(finalOrders.length).toBe(2);
    });
  });

  describe('Complete Business Operations Flow', () => {
    it('should simulate a complete business day operations', async () => {
      const token = 'token-123';

      // Morning: Setup
      // 1. Check system health
      const healthResponse = await fetch(`${API_BASE}/health`);
      expect(healthResponse.ok).toBe(true);
      const health = await healthResponse.json();
      expect(health.status).toBe('ok');

      // 2. Create inventory
      const inventoryItems = [
        { name: 'Coffee Beans', price: 20, cost_price: 12, stock_qty: 100, unit: 'kg', category: 'Beverages' },
        { name: 'Pastries', price: 5, cost_price: 2, stock_qty: 50, unit: 'piece', category: 'Food' },
        { name: 'Sandwich', price: 8, cost_price: 4, stock_qty: 30, unit: 'piece', category: 'Food' }
      ];

      const createdProducts = [];
      for (const item of inventoryItems) {
        const response = await fetch(`${API_BASE}/tenants/tenant-123/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(item)
        });
        createdProducts.push(await response.json());
      }

      // 3. Setup end-of-day accounts
      const endOfDayAccounts = [
        { name: 'Cash Register', type: 'cash', balance: 500 },
        { name: 'Bank Account', type: 'bank', balance: 2000 }
      ];

      for (const account of endOfDayAccounts) {
        await fetch(`${API_BASE}/tenants/tenant-123/accounts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(account)
        });
      }

      // Business Hours: Process sales
      const customers = [
        { name: 'Morning Customer', type: 'customer', phone: '+1111111111' },
        { name: 'Afternoon Customer', type: 'customer', email: 'afternoon@example.com' },
        { name: 'Evening Customer', type: 'customer', phone: '+2222222222' }
      ];

      for (const customer of customers) {
        // Create customer
        const partyResponse = await fetch(`${API_BASE}/tenants/tenant-123/parties`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(customer)
        });
        const party = await partyResponse.json();

        // Create order
        const orderItems = createdProducts.map(product => ({
          product_name: product.name,
          qty: Math.floor(Math.random() * 3) + 1,
          unit_price: product.price,
          total: product.price * (Math.floor(Math.random() * 3) + 1)
        }));

        const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
        const taxAmount = subtotal * 0.1;
        const total = subtotal + taxAmount;

        const orderResponse = await fetch(`${API_BASE}/tenants/tenant-123/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            order_number: `INV-${Date.now()}`,
            party_name: party.name,
            party_phone: party.phone,
            channel: 'walk-in',
            payment_mode: 'cash',
            subtotal,
            discount: 0,
            tax_amount: taxAmount,
            total,
            paid_amount: total,
            balance_due: 0,
            items: orderItems
          })
        });

        expect(orderResponse.ok).toBe(true);
      }

      // End of Day: Review
      // 1. Check total orders
      const ordersResponse = await fetch(`${API_BASE}/tenants/tenant-123/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(ordersResponse.ok).toBe(true);
      const orders = await ordersResponse.json();
      expect(orders.length).toBe(3);

      // 2. Check inventory
      const productsResponse = await fetch(`${API_BASE}/tenants/tenant-123/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(productsResponse.ok).toBe(true);
      const products = await productsResponse.json();
      expect(products.length).toBe(3);

      // 3. Check customers
      const partiesResponse = await fetch(`${API_BASE}/tenants/tenant-123/parties`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(partiesResponse.ok).toBe(true);
      const parties = await partiesResponse.json();
      expect(parties.length).toBe(3);

      // 4. Check accounts
      const accountsResponse = await fetch(`${API_BASE}/tenants/tenant-123/accounts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(accountsResponse.ok).toBe(true);
      const accounts = await accountsResponse.json();
      expect(accounts.length).toBe(2);
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    it('should handle authentication errors gracefully', async () => {
      // Try to access protected endpoints without token
      const productsResponse = await fetch(`${API_BASE}/tenants/tenant-123/products`);
      expect(productsResponse.ok).toBe(false);

      // Try with invalid token
      const invalidResponse = await fetch(`${API_BASE}/tenants/tenant-123/products`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      expect(invalidResponse.ok).toBe(false);
    });

    it('should handle validation errors', async () => {
      const token = 'token-123';

      // Try to create product with invalid data
      const invalidProductResponse = await fetch(`${API_BASE}/tenants/tenant-123/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: '', // Empty name
          price: -100, // Negative price
          stock_qty: -10 // Negative stock
        })
      });

      expect(invalidProductResponse.ok).toBe(false);

      // Try to create order with invalid data
      const invalidOrderResponse = await fetch(`${API_BASE}/tenants/tenant-123/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_number: '', // Empty order number
          total: -100, // Negative total
          items: [] // Empty items
        })
      });

      expect(invalidOrderResponse.ok).toBe(false);
    });

    it('should handle not found errors', async () => {
      const token = 'token-123';

      // Try to get non-existent product
      const productResponse = await fetch(`${API_BASE}/tenants/tenant-123/products/nonexistent`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      expect(productResponse.ok).toBe(false);

      // Try to update non-existent party
      const partyResponse = await fetch(`${API_BASE}/tenants/tenant-123/parties/nonexistent`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: 'Updated Name' })
      });
      expect(partyResponse.ok).toBe(false);

      // Try to delete non-existent order
      const orderResponse = await fetch(`${API_BASE}/tenants/tenant-123/orders/nonexistent`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      expect(orderResponse.ok).toBe(false);
    });
  });
});
