import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '../db';
import { createMockResponse, createErrorResponse } from '../../test/__mocks__/fetch';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment variables
vi.mock('@/lib/auth', () => ({
  getAuthHeaders: () => ({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-token',
  }),
}));

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Product endpoints', () => {
    it('should get products successfully', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', price: 100 },
        { id: '2', name: 'Product 2', price: 200 },
      ];
      
      mockFetch.mockResolvedValue(createMockResponse(mockProducts));
      
      const result = await api.getProducts('tenant-123');
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/tenants/tenant-123/products',
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
        }
      );
      expect(result).toEqual(mockProducts);
    });

    it('should create product successfully', async () => {
      const newProduct = { name: 'New Product', price: 150 };
      const createdProduct = { id: '3', ...newProduct };
      
      mockFetch.mockResolvedValue(createMockResponse(createdProduct));
      
      const result = await api.createProduct('tenant-123', newProduct);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/tenants/tenant-123/products',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
          body: JSON.stringify(newProduct),
        }
      );
      expect(result).toEqual(createdProduct);
    });

    it('should update product successfully', async () => {
      const updateData = { name: 'Updated Product', price: 180 };
      const updatedProduct = { id: '1', ...updateData };
      
      mockFetch.mockResolvedValue(createMockResponse(updatedProduct));
      
      const result = await api.updateProduct('tenant-123', '1', updateData);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/tenants/tenant-123/products/1',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
          body: JSON.stringify(updateData),
        }
      );
      expect(result).toEqual(updatedProduct);
    });

    it('should delete product successfully', async () => {
      const deletedProduct = { id: '1', name: 'Deleted Product' };
      
      mockFetch.mockResolvedValue(createMockResponse(deletedProduct));
      
      const result = await api.deleteProduct('tenant-123', '1');
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/tenants/tenant-123/products/1',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
        }
      );
      expect(result).toEqual(deletedProduct);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue(createErrorResponse('Failed to get products', 500));
      
      await expect(api.getProducts('tenant-123')).rejects.toThrow('Failed to get products');
    });
  });

  describe('Order endpoints', () => {
    it('should get orders successfully', async () => {
      const mockOrders = [
        { id: '1', order_number: 'INV-00001', total: 500 },
        { id: '2', order_number: 'INV-00002', total: 300 },
      ];
      
      mockFetch.mockResolvedValue(createMockResponse(mockOrders));
      
      const result = await api.getOrders('tenant-123');
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/tenants/tenant-123/orders',
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
        }
      );
      expect(result).toEqual(mockOrders);
    });

    it('should create order successfully', async () => {
      const newOrder = {
        order_number: 'INV-00003',
        party_name: 'Test Customer',
        total: 400,
      };
      const createdOrder = { id: '3', ...newOrder };
      
      mockFetch.mockResolvedValue(createMockResponse(createdOrder));
      
      const result = await api.createOrder('tenant-123', newOrder);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/tenants/tenant-123/orders',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
          body: JSON.stringify(newOrder),
        }
      );
      expect(result).toEqual(createdOrder);
    });

    it('should get order items successfully', async () => {
      const mockItems = [
        { id: '1', product_name: 'Product 1', qty: 2, total: 200 },
        { id: '2', product_name: 'Product 2', qty: 1, total: 100 },
      ];
      
      mockFetch.mockResolvedValue(createMockResponse(mockItems));
      
      const result = await api.getOrderItems('tenant-123', 'order-123');
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/tenants/tenant-123/orders/order-123/items',
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
        }
      );
      expect(result).toEqual(mockItems);
    });
  });

  describe('Party endpoints', () => {
    it('should get parties successfully', async () => {
      const mockParties = [
        { id: '1', name: 'Customer A', type: 'customer' },
        { id: '2', name: 'Vendor B', type: 'vendor' },
      ];
      
      mockFetch.mockResolvedValue(createMockResponse(mockParties));
      
      const result = await api.getParties('tenant-123');
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/tenants/tenant-123/parties',
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
        }
      );
      expect(result).toEqual(mockParties);
    });

    it('should create party successfully', async () => {
      const newParty = { name: 'New Customer', type: 'customer' };
      const createdParty = { id: '3', ...newParty };
      
      mockFetch.mockResolvedValue(createMockResponse(createdParty));
      
      const result = await api.createParty('tenant-123', newParty);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/tenants/tenant-123/parties',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
          body: JSON.stringify(newParty),
        }
      );
      expect(result).toEqual(createdParty);
    });
  });

  describe('Account endpoints', () => {
    it('should get accounts successfully', async () => {
      const mockAccounts = [
        { id: '1', name: 'Cash Account', type: 'cash', balance: 1000 },
        { id: '2', name: 'Bank Account', type: 'bank', balance: 5000 },
      ];
      
      mockFetch.mockResolvedValue(createMockResponse(mockAccounts));
      
      const result = await api.getAccounts('tenant-123');
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/tenants/tenant-123/accounts',
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
        }
      );
      expect(result).toEqual(mockAccounts);
    });

    it('should create account successfully', async () => {
      const newAccount = { name: 'New Account', type: 'cash', balance: 0 };
      const createdAccount = { id: '3', ...newAccount };
      
      mockFetch.mockResolvedValue(createMockResponse(createdAccount));
      
      const result = await api.createAccount('tenant-123', newAccount);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/tenants/tenant-123/accounts',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          },
          body: JSON.stringify(newAccount),
        }
      );
      expect(result).toEqual(createdAccount);
    });
  });
});
