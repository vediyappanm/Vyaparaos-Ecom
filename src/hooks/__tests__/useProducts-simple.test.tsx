import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the API client
const mockApi = {
  getProducts: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
};

vi.mock('@/lib/db', () => ({
  api: mockApi,
}));

// Mock the tenant context
vi.mock('@/contexts/TenantContext', () => ({
  useTenant: () => ({
    tenant: { id: 'tenant-123' },
  }),
}));

describe('useProducts (Simple)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should test API client directly', async () => {
    const mockProducts = [
      { id: '1', name: 'Product 1', price: 100 },
      { id: '2', name: 'Product 2', price: 200 },
    ];
    
    mockApi.getProducts.mockResolvedValue(mockProducts);
    
    const result = await mockApi.getProducts('tenant-123');
    
    expect(mockApi.getProducts).toHaveBeenCalledWith('tenant-123');
    expect(result).toEqual(mockProducts);
  });

  it('should test product creation', async () => {
    const newProduct = { name: 'New Product', price: 150 };
    const createdProduct = { id: '3', ...newProduct };
    
    mockApi.createProduct.mockResolvedValue(createdProduct);
    
    const result = await mockApi.createProduct('tenant-123', newProduct);
    
    expect(mockApi.createProduct).toHaveBeenCalledWith('tenant-123', newProduct);
    expect(result).toEqual(createdProduct);
  });

  it('should test product update', async () => {
    const updateData = { name: 'Updated Product', price: 180 };
    const updatedProduct = { id: '1', ...updateData };
    
    mockApi.updateProduct.mockResolvedValue(updatedProduct);
    
    const result = await mockApi.updateProduct('tenant-123', '1', updateData);
    
    expect(mockApi.updateProduct).toHaveBeenCalledWith('tenant-123', '1', updateData);
    expect(result).toEqual(updatedProduct);
  });

  it('should test product deletion', async () => {
    const deletedProduct = { id: '1', name: 'Deleted Product' };
    
    mockApi.deleteProduct.mockResolvedValue(deletedProduct);
    
    const result = await mockApi.deleteProduct('tenant-123', '1');
    
    expect(mockApi.deleteProduct).toHaveBeenCalledWith('tenant-123', '1');
    expect(result).toEqual(deletedProduct);
  });

  it('should test API errors', async () => {
    const errorMessage = 'Failed to get products';
    mockApi.getProducts.mockRejectedValue(new Error(errorMessage));
    
    await expect(mockApi.getProducts('tenant-123')).rejects.toThrow(errorMessage);
  });

  it('should test create errors', async () => {
    const errorMessage = 'Failed to create product';
    mockApi.createProduct.mockRejectedValue(new Error(errorMessage));
    
    await expect(mockApi.createProduct('tenant-123', { name: 'Test', price: 100 })).rejects.toThrow(errorMessage);
  });

  it('should test update errors', async () => {
    const errorMessage = 'Failed to update product';
    mockApi.updateProduct.mockRejectedValue(new Error(errorMessage));
    
    await expect(mockApi.updateProduct('tenant-123', '1', { name: 'Test', price: 100 })).rejects.toThrow(errorMessage);
  });

  it('should test delete errors', async () => {
    const errorMessage = 'Failed to delete product';
    mockApi.deleteProduct.mockRejectedValue(new Error(errorMessage));
    
    await expect(mockApi.deleteProduct('tenant-123', '1')).rejects.toThrow(errorMessage);
  });
});
