// Mock fetch for API testing
export const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create mock responses
export const createMockResponse = (data: any, ok = true, status = 200) => {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response;
};

// Helper to create error responses
export const createErrorResponse = (error: string, status = 400) => {
  return {
    ok: false,
    status,
    json: () => Promise.resolve({ error }),
    text: () => Promise.resolve(JSON.stringify({ error })),
  } as Response;
};
