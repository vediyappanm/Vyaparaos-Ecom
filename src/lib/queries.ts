import { api } from './db';

// User queries - now handled by auth API, kept for compatibility
export async function queryUserByEmail(email: string) {
  // This is now handled by the auth API directly
  throw new Error('queryUserByEmail is deprecated. Use auth API directly.');
}

export async function createUser(email: string, passwordHash: string, fullName?: string, phone?: string) {
  // This is now handled by the auth API directly
  throw new Error('createUser is deprecated. Use auth API directly.');
}

export async function getUserById(id: string) {
  // This is now handled by the auth API directly
  throw new Error('getUserById is deprecated. Use auth API directly.');
}

export async function getUserRoles(userId: string) {
  // Use the new API endpoint
  const context = await api.getUserContext();
  return [{
    role: context.role,
    tenant_id: context.tenant_id,
    tenant_name: context.tenant_name
  }];
}

export async function getTenantById(tenantId: string) {
  return await api.getTenantById(tenantId);
}

export async function createTenant(data: {
  name: string;
  slug: string;
  gstin?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  pincode?: string;
}) {
  return await api.createTenant(data);
}

export async function createUserRole(userId: string, tenantId: string, role: string) {
  // This is now handled automatically when creating a tenant
  throw new Error('createUserRole is deprecated. Role is assigned automatically on tenant creation.');
}

export async function getTenantBySlug(slug: string) {
  return await api.getTenantBySlug(slug);
}
