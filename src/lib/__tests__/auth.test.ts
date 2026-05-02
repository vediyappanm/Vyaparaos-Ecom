import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signUp, signIn, getSession, setSession, clearSession, getAuthHeaders, verifyToken } from '../auth';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('signUp', () => {
    it('should sign up user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        phone: '+1234567890'
      };
      
      const mockResponse = {
        user: { id: '1', email: userData.email, full_name: userData.fullName },
        token: 'test-token'
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await signUp(userData.email, userData.password, userData.fullName, userData.phone);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/signup',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle signup errors', async () => {
      const errorMessage = 'Email already exists';
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: errorMessage }),
      } as Response);

      await expect(signUp('test@example.com', 'password123')).rejects.toThrow(errorMessage);
    });
  });

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = {
        user: { id: '1', email: credentials.email },
        token: 'test-token'
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await signIn(credentials.email, credentials.password);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/signin',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle signin errors', async () => {
      const errorMessage = 'Invalid credentials';
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: errorMessage }),
      } as Response);

      await expect(signIn('test@example.com', 'wrongpassword')).rejects.toThrow(errorMessage);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const token = 'valid-token';
      const mockPayload = { userId: '1', email: 'test@example.com' };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ valid: true, payload: mockPayload }),
      } as Response);

      const result = await verifyToken(token);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/verify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        }
      );
      expect(result).toEqual(mockPayload);
    });

    it('should handle invalid token', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ valid: false }),
      } as Response);

      const result = await verifyToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await verifyToken('test-token');

      expect(result).toBeNull();
    });
  });

  describe('Session management', () => {
    it('should get session when token and user exist', async () => {
      const token = 'test-token';
      const user = { id: '1', email: 'test@example.com', full_name: 'Test User', phone: null, avatar_url: null };
      const mockPayload = { userId: '1', email: 'test@example.com' };
      
      localStorageMock.getItem
        .mockImplementation((key) => {
          if (key === 'auth_token') return token;
          if (key === 'auth_user') return JSON.stringify(user);
          return null;
        });
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ valid: true, payload: mockPayload }),
      } as Response);

      const result = await getSession();

      expect(result).toEqual({ user, token });
      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_user');
    });

    it('should return null when token is missing', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await getSession();

      expect(result).toBeNull();
    });

    it('should return null when token is invalid', async () => {
      localStorageMock.getItem
        .mockImplementation((key) => {
          if (key === 'auth_token') return 'invalid-token';
          if (key === 'auth_user') return JSON.stringify({ id: '1' });
          return null;
        });
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ valid: false }),
      } as Response);

      const result = await getSession();

      expect(result).toBeNull();
    });

    it('should set session correctly', () => {
      const user = { id: '1', email: 'test@example.com', full_name: 'Test User', phone: null, avatar_url: null };
      const token = 'test-token';

      setSession(user, token);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', token);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(user));
    });

    it('should clear session correctly', () => {
      clearSession();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
    });
  });

  describe('getAuthHeaders', () => {
    it('should return headers with token when token exists', () => {
      localStorageMock.getItem.mockReturnValue('test-token');

      const headers = getAuthHeaders();

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      });
    });

    it('should return headers without token when token is missing', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const headers = getAuthHeaders();

      expect(headers).toEqual({
        'Content-Type': 'application/json',
      });
    });
  });
});
