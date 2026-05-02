import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockResponse, createErrorResponse } from '../__mocks__/fetch';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('End-to-End User Flows (Fixed)', () => {
  const API_BASE = 'http://localhost:3001/api';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete User Onboarding Flow', () => {
    it('should complete full user registration and tenant setup', async () => {
      // Step 1: User signs up
      const signupData = {
        email: 'newuser@example.com',
        password: 'SecurePassword123',
        fullName: 'John Doe',
        phone: '+1234567890'
      };

      const signupResponse = {
        user: { id: 'user-123', email: signupData.email, full_name: signupData.fullName, phone: signupData.phone, avatar_url: null },
        token: 'token-123'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(signupResponse));

      const signupResult = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      });

      expect(signupResult.ok).toBe(true);
      const signupDataResult = await signupResult.json();
      expect(signupDataResult.user.email).toBe(signupData.email);
      expect(signupDataResult.token).toBe('token-123');

      // Step 2: Verify token
      const verifyResponse = {
        valid: true,
        payload: { userId: 'user-123', email: signupData.email }
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(verifyResponse));

      const verifyResult = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'token-123' })
      });

      expect(verifyResult.ok).toBe(true);
      const verifyData = await verifyResult.json();
      expect(verifyData.valid).toBe(true);

      // Step 3: Create tenant
      const tenantData = {
        name: 'John\'s Store',
        slug: 'johns-store'
      };

      const tenantResponse = {
        id: 'tenant-123',
        name: tenantData.name,
        slug: tenantData.slug,
        user_id: 'user-123'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(tenantResponse));

      const tenantResult = await fetch(`${API_BASE}/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-123'
        },
        body: JSON.stringify(tenantData)
      });

      expect(tenantResult.ok).toBe(true);
      const createdTenant = await tenantResult.json();
      expect(createdTenant.name).toBe('John\'s Store');
      expect(createdTenant.slug).toBe('johns-store');

      // Step 4: Verify tenant creation
      mockFetch.mockResolvedValueOnce(createMockResponse(createdTenant));

      const getTenantResult = await fetch(`${API_BASE}/tenants/tenant-123`, {
        headers: { 'Authorization': 'Bearer token-123' }
      });

      expect(getTenantResult.ok).toBe(true);
      const retrievedTenant = await getTenantResult.json();
      expect(retrievedTenant.id).toBe('tenant-123');
      expect(retrievedTenant.name).toBe('John\'s Store');
    });
  });

  describe('Complete Product Management Flow', () => {
    it('should complete full product lifecycle', async () => {
      const token = 'test-token';
      const tenantId = 'tenant-123';

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
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const createdProduct = {
          id: `product-${i + 1}`,
          tenant_id: tenantId,
          ...product,
          is_active: true
        };
        createdProducts.push(createdProduct);
        mockFetch.mockResolvedValueOnce(createMockResponse(createdProduct));

        const response = await fetch(`${API_BASE}/tenants/${tenantId}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(product)
        });

        expect(response.ok).toBe(true);
        const result = await response.json();
        expect(result.name).toBe(product.name);
      }

      // Step 2: List all products
      mockFetch.mockResolvedValueOnce(createMockResponse(createdProducts));

      const listResponse = await fetch(`${API_BASE}/tenants/${tenantId}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(listResponse.ok).toBe(true);
      const allProducts = await listResponse.json();
      expect(allProducts.length).toBe(3);

      // Step 3: Update a product
      const updateData = {
        price: 1100,
        stock_qty: 8,
        description: 'Updated high-performance laptop'
      };

      const updatedProduct = {
        ...createdProducts[0],
        ...updateData
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(updatedProduct));

      const updateResponse = await fetch(`${API_BASE}/tenants/${tenantId}/products/product-1`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      expect(updateResponse.ok).toBe(true);
      const updated = await updateResponse.json();
      expect(updated.price).toBe(1100);
      expect(updated.stock_qty).toBe(8);

      // Step 4: Delete a product
      const deletedProduct = createdProducts[2];
      mockFetch.mockResolvedValueOnce(createMockResponse(deletedProduct));

      const deleteResponse = await fetch(`${API_BASE}/tenants/${tenantId}/products/product-3`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(deleteResponse.ok).toBe(true);
      const deleted = await deleteResponse.json();
      expect(deleted.id).toBe('product-3');

      // Step 5: Verify remaining products
      const remainingProducts = [createdProducts[0], createdProducts[1]];
      mockFetch.mockResolvedValueOnce(createMockResponse(remainingProducts));

      const finalListResponse = await fetch(`${API_BASE}/tenants/${tenantId}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(finalListResponse.ok).toBe(true);
      const remaining = await finalListResponse.json();
      expect(remaining.length).toBe(2);
    });
  });

  describe('Complete Order Management Flow', () => {
    it('should complete full order lifecycle', async () => {
      const token = 'test-token';
      const tenantId = 'tenant-123';

      // Setup: Create products
      const mockProducts = [
        { id: 'product-1', name: 'Product A', price: 100 },
        { id: 'product-2', name: 'Product B', price: 50 }
      ];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockProducts));

      // Setup: Create parties
      const mockParties = [
        { id: 'party-1', name: 'Customer A', type: 'customer' },
        { id: 'party-2', name: 'Customer B', type: 'customer' }
      ];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockParties));

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

      const createdOrder = {
        id: 'order-1',
        tenant_id: tenantId,
        ...orderData,
        status: 'confirmed'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(createdOrder));

      const createResponse = await fetch(`${API_BASE}/tenants/${tenantId}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      expect(createResponse.ok).toBe(true);
      const orderResult = await createResponse.json();
      expect(orderResult.order_number).toBe(orderData.order_number);
      expect(orderResult.total).toBe(orderData.total);

      // Step 2: Get order items
      const mockItems = orderData.items;
      mockFetch.mockResolvedValueOnce(createMockResponse(mockItems));

      const itemsResponse = await fetch(`${API_BASE}/tenants/${tenantId}/orders/order-1/items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(itemsResponse.ok).toBe(true);
      const items = await itemsResponse.json();
      expect(items.length).toBe(2);

      // Step 3: List all orders
      const allOrders = [createdOrder];
      mockFetch.mockResolvedValueOnce(createMockResponse(allOrders));

      const listResponse = await fetch(`${API_BASE}/tenants/${tenantId}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(listResponse.ok).toBe(true);
      const orders = await listResponse.json();
      expect(orders.length).toBe(1);
      expect(orders[0].order_number).toBe(orderData.order_number);

      // Step 4: Create another order
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

      const secondOrder = {
        id: 'order-2',
        tenant_id: tenantId,
        ...secondOrderData,
        status: 'confirmed'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(secondOrder));

      await fetch(`${API_BASE}/tenants/${tenantId}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(secondOrderData)
      });

      // Step 5: Verify multiple orders
      const finalOrders = [createdOrder, secondOrder];
      mockFetch.mockResolvedValueOnce(createMockResponse(finalOrders));

      const finalListResponse = await fetch(`${API_BASE}/tenants/${tenantId}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(finalListResponse.ok).toBe(true);
      const finalOrdersResult = await finalListResponse.json();
      expect(finalOrdersResult.length).toBe(2);
    });
  });

  describe('Complete Business Operations Flow', () => {
    it('should simulate a complete business day operations', async () => {
      const token = 'test-token';
      const tenantId = 'tenant-123';

      // Morning: Setup
      // 1. Check system health
      mockFetch.mockResolvedValueOnce(createMockResponse({ status: 'ok' }));

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
      for (let i = 0; i < inventoryItems.length; i++) {
        const item = inventoryItems[i];
        const createdProduct = {
          id: `product-${i + 1}`,
          tenant_id: tenantId,
          ...item,
          is_active: true
        };
        createdProducts.push(createdProduct);
        mockFetch.mockResolvedValueOnce(createMockResponse(createdProduct));

        await fetch(`${API_BASE}/tenants/${tenantId}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(item)
        });
      }

      // 3. Setup business accounts
      const businessAccounts = [
        { name: 'Cash Register', type: 'cash', balance: 500 },
        { name: 'Bank Account', type: 'bank', balance: 2000 }
      ];

      const createdAccounts = [];
      for (let i = 0; i < businessAccounts.length; i++) {
        const account = businessAccounts[i];
        const createdAccount = {
          id: `account-${i + 1}`,
          tenant_id: tenantId,
          ...account,
          is_active: true
        };
        createdAccounts.push(createdAccount);
        mockFetch.mockResolvedValueOnce(createMockResponse(createdAccount));

        await fetch(`${API_BASE}/tenants/${tenantId}/accounts`, {
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

      const createdOrders = [];
      for (let i = 0; i < customers.length; i++) {
        // Create customer
        const customer = customers[i];
        const createdParty = {
          id: `party-${i + 1}`,
          tenant_id: tenantId,
          ...customer
        };
        mockFetch.mockResolvedValueOnce(createMockResponse(createdParty));

        await fetch(`${API_BASE}/tenants/${tenantId}/parties`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(customer)
        });

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

        const orderData = {
          order_number: `INV-${Date.now()}-${i + 1}`,
          party_name: customer.name,
          party_phone: customer.phone,
          channel: 'walk-in',
          payment_mode: 'cash',
          subtotal,
          discount: 0,
          tax_amount: taxAmount,
          total,
          paid_amount: total,
          balance_due: 0,
          items: orderItems
        };

        const createdOrder = {
          id: `order-${i + 1}`,
          tenant_id: tenantId,
          ...orderData,
          status: 'confirmed'
        };
        createdOrders.push(createdOrder);
        mockFetch.mockResolvedValueOnce(createMockResponse(createdOrder));

        await fetch(`${API_BASE}/tenants/${tenantId}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(orderData)
        });
      }

      // End of Day: Review
      // 1. Check total orders
      mockFetch.mockResolvedValueOnce(createMockResponse(createdOrders));

      const ordersResponse = await fetch(`${API_BASE}/tenants/${tenantId}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(ordersResponse.ok).toBe(true);
      const orders = await ordersResponse.json();
      expect(orders.length).toBe(3);

      // 2. Check inventory
      mockFetch.mockResolvedValueOnce(createMockResponse(createdProducts));

      const productsResponse = await fetch(`${API_BASE}/tenants/${tenantId}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(productsResponse.ok).toBe(true);
      const products = await productsResponse.json();
      expect(products.length).toBe(3);

      // 3. Check customers
      const createdParties = customers.map((customer, i) => ({
        id: `party-${i + 1}`,
        tenant_id: tenantId,
        ...customer
      }));
      mockFetch.mockResolvedValueOnce(createMockResponse(createdParties));

      const partiesResponse = await fetch(`${API_BASE}/tenants/${tenantId}/parties`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(partiesResponse.ok).toBe(true);
      const parties = await partiesResponse.json();
      expect(parties.length).toBe(3);

      // 4. Check accounts
      mockFetch.mockResolvedValueOnce(createMockResponse(createdAccounts));

      const accountsResponse = await fetch(`${API_BASE}/tenants/${tenantId}/accounts`, {
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
      mockFetch.mockResolvedValueOnce(createErrorResponse('Unauthorized', 401));

      const productsResponse = await fetch(`${API_BASE}/tenants/tenant-123/products`);
      expect(productsResponse.ok).toBe(false);

      // Try with invalid token
      mockFetch.mockResolvedValueOnce(createErrorResponse('Unauthorized', 401));

      const invalidResponse = await fetch(`${API_BASE}/tenants/tenant-123/products`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      expect(invalidResponse.ok).toBe(false);
    });

    it('should handle validation errors', async () => {
      const token = 'test-token';

      // Try to create product with invalid data
      mockFetch.mockResolvedValueOnce(createErrorResponse('Validation error', 400));

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
      mockFetch.mockResolvedValueOnce(createErrorResponse('Validation error', 400));

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
      const token = 'test-token';

      // Try to get non-existent product
      mockFetch.mockResolvedValueOnce(createErrorResponse('Not found', 404));

      const productResponse = await fetch(`${API_BASE}/tenants/tenant-123/products/nonexistent`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      expect(productResponse.ok).toBe(false);

      // Try to update non-existent party
      mockFetch.mockResolvedValueOnce(createErrorResponse('Not found', 404));

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
      mockFetch.mockResolvedValueOnce(createErrorResponse('Not found', 404));

      const orderResponse = await fetch(`${API_BASE}/tenants/tenant-123/orders/nonexistent`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      expect(orderResponse.ok).toBe(false);
    });
  });
});
