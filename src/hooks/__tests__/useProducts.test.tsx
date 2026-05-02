import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProducts, useUpsertProduct, useDeleteProduct } from '../useProducts';
import { api } from '@/lib/db';
import { createMockResponse, createErrorResponse } from '../../test/__mocks__/fetch';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the api module
vi.mock('@/lib/db', () => ({
  api: {
    getProducts: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));

// Mock the tenant context
vi.mock('@/contexts/TenantContext', () => ({
  useTenant: () => ({
    tenant: { id: 'tenant-123' },
  }),
}));

// Wrapper component for testing hooks with React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch products successfully', async () => {
    const mockProducts = [
      { id: '1', name: 'Product 1', price: 100 },
      { id: '2', name: 'Product 2', price: 200 },
    ];
    
    vi.mocked(api.getProducts).mockResolvedValue(mockProducts);

    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    });

    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockProducts);
    });

    expect(api.getProducts).toHaveBeenCalledWith('tenant-123');
  });

  it('should handle fetch errors', async () => {
    const errorMessage = 'Failed to fetch products';
    vi.mocked(api.getProducts).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    });

    await vi.waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe(errorMessage);
  });

  it('should show loading state initially', () => {
    vi.mocked(api.getProducts).mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });
});

describe('useUpsertProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new product successfully', async () => {
    const newProduct = { name: 'New Product', price: 150 };
    const createdProduct = { id: '3', ...newProduct };
    
    vi.mocked(api.createProduct).mockResolvedValue(createdProduct);

    const { result } = renderHook(() => useUpsertProduct(), {
      wrapper: createWrapper(),
    });

    await vi.waitFor(() => {
      expect(result.current.mutateAsync).toBeDefined();
    });

    const response = await result.current.mutateAsync(newProduct);

    expect(api.createProduct).toHaveBeenCalledWith('tenant-123', newProduct);
    expect(response).toEqual(createdProduct);
  });

  it('should update an existing product successfully', async () => {
    const updateData = { id: '1', name: 'Updated Product', price: 180 };
    const updatedProduct = { id: '1', name: 'Updated Product', price: 180 };
    
    vi.mocked(api.updateProduct).mockResolvedValue(updatedProduct);

    const { result } = renderHook(() => useUpsertProduct(), {
      wrapper: createWrapper(),
    });

    await vi.waitFor(() => {
      expect(result.current.mutateAsync).toBeDefined();
    });

    const response = await result.current.mutateAsync(updateData);

    expect(api.updateProduct).toHaveBeenCalledWith('tenant-123', '1', updateData);
    expect(response).toEqual(updatedProduct);
  });

  it('should handle create errors', async () => {
    const errorMessage = 'Failed to create product';
    vi.mocked(api.createProduct).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useUpsertProduct(), {
      wrapper: createWrapper(),
    });

    await vi.waitFor(() => {
      expect(result.current.mutateAsync).toBeDefined();
    });

    await expect(result.current.mutateAsync({ name: 'Test', price: 100 })).rejects.toThrow(errorMessage);
  });

  it('should handle update errors', async () => {
    const errorMessage = 'Failed to update product';
    vi.mocked(api.updateProduct).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useUpsertProduct(), {
      wrapper: createWrapper(),
    });

    await vi.waitFor(() => {
      expect(result.current.mutateAsync).toBeDefined();
    });

    await expect(result.current.mutateAsync({ id: '1', name: 'Test', price: 100 })).rejects.toThrow(errorMessage);
  });
});

describe('useDeleteProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete a product successfully', async () => {
    const deletedProduct = { id: '1', name: 'Deleted Product' };
    
    vi.mocked(api.deleteProduct).mockResolvedValue(deletedProduct);

    const { result } = renderHook(() => useDeleteProduct(), {
      wrapper: createWrapper(),
    });

    await vi.waitFor(() => {
      expect(result.current.mutateAsync).toBeDefined();
    });

    const response = await result.current.mutateAsync('1');

    expect(api.deleteProduct).toHaveBeenCalledWith('tenant-123', '1');
    expect(response).toEqual(deletedProduct);
  });

  it('should handle delete errors', async () => {
    const errorMessage = 'Failed to delete product';
    vi.mocked(api.deleteProduct).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useDeleteProduct(), {
      wrapper: createWrapper(),
    });

    await vi.waitFor(() => {
      expect(result.current.mutateAsync).toBeDefined();
    });

    await expect(result.current.mutateAsync('1')).rejects.toThrow(errorMessage);
  });
});
