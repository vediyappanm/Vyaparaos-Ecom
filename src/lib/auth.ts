import bcrypt from 'bcryptjs';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export interface Session {
  user: User;
  token: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signUp(email: string, password: string, fullName?: string, phone?: string): Promise<{ user: User; token: string }> {
  const response = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName, phone }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Signup failed');
  }
  
  const data = await response.json();
  return { user: data.user, token: data.token };
}

export async function signIn(email: string, password: string): Promise<{ user: User; token: string }> {
  const response = await fetch(`${API_URL}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Signin failed');
  }
  
  const data = await response.json();
  return { user: data.user, token: data.token };
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await response.json();
    return data.valid ? data.payload : null;
  } catch (error) {
    return null;
  }
}

// Helper to get auth headers for API calls
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export async function getSession(): Promise<Session | null> {
  const token = localStorage.getItem('auth_token');
  const userStr = localStorage.getItem('auth_user');
  
  if (!token || !userStr) return null;
  
  const decoded = await verifyToken(token);
  if (!decoded) return null;
  
  return {
    user: JSON.parse(userStr),
    token
  };
}

export function setSession(user: User, token: string): void {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

export async function queryUserByEmail(email: string) {
  const { db } = await import('./db');
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

export async function createUser(email: string, passwordHash: string, fullName?: string, phone?: string) {
  const { db } = await import('./db');
  const result = await db.query(
    'INSERT INTO users (email, password_hash, full_name, phone) VALUES ($1, $2, $3, $4) RETURNING *',
    [email, passwordHash, fullName || null, phone || null]
  );
  return result.rows[0];
}
