import { vi } from 'vitest';

export interface MockSessionUser {
  id: string;
  name: string;
  email?: string;
  role: number;
}

export function createMockSession(user: MockSessionUser | null) {
  return user ? { user, expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() } : null;
}

export const mockAdminSession = createMockSession({
  id: '1',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 2
});

export const mockPatientSession = createMockSession({
  id: '10',
  name: 'Patient 01',
  role: 1
});

// Helper ฟังก์ชันสำหรับกำหนด mock session ในแต่ละ test case
export function mockAuthSession(session = mockPatientSession) {
  vi.mock('@/auth', () => ({
    auth: vi.fn().mockResolvedValue(session),
    signIn: vi.fn(),
    signOut: vi.fn()
  }));
}
