import { api } from './db';

// Products
export async function getProducts(tenantId: string) {
  return await api.getProducts(tenantId);
}

export async function createProduct(tenantId: string, data: any) {
  return await api.createProduct(tenantId, data);
}

export async function updateProduct(id: string, data: any) {
  const tenantId = data.tenantId ?? data.tenant_id;
  return await api.updateProduct(tenantId, id, data);
}

export async function deleteProduct(id: string, tenantId: string) {
  return await api.deleteProduct(tenantId, id);
}

// Parties
export async function getParties(tenantId: string) {
  return await api.getParties(tenantId);
}

export async function createParty(tenantId: string, data: any) {
  return await api.createParty(tenantId, data);
}

// Orders
export async function getOrders(tenantId: string, limit = 50) {
  const orders = await api.getOrders(tenantId);
  return orders.slice(0, limit);
}

export async function createOrder(tenantId: string, data: any) {
  return await api.createOrder(tenantId, data);
}

export async function getOrderItems(orderId: string, tenantId: string) {
  return await api.getOrderItems(tenantId, orderId);
}

export async function createOrderItem(data: any) {
  // This would need a new endpoint
  throw new Error('createOrderItem not implemented yet - needs endpoint');
}

// Staff
export async function getStaff(tenantId: string) {
  // This would need a new endpoint
  throw new Error('getStaff not implemented yet - needs staff endpoint');
}

export async function createStaff(tenantId: string, data: any) {
  // This would need a new endpoint
  throw new Error('createStaff not implemented yet - needs staff endpoint');
}

// Invites
export async function createInvite(tenantId: string, data: any) {
  // This would need a new endpoint
  throw new Error('createInvite not implemented yet - needs invites endpoint');
}

export async function getInviteByCode(code: string) {
  // This would need a new endpoint
  throw new Error('getInviteByCode not implemented yet - needs invites endpoint');
}

export async function acceptInvite(code: string, userId: string) {
  // This would need a new endpoint
  throw new Error('acceptInvite not implemented yet - needs invites endpoint');
}
