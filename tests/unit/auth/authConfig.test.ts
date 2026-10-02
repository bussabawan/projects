import { describe, it, expect } from 'vitest';
import { authConfig } from '@/auth.config';

interface MockAuth {
  user?: {
    id?: string;
    role?: number;
    fullName?: string;
  };
}

interface AuthorizedParams {
  auth: MockAuth | null;
  request: { nextUrl: URL };
}

describe('authConfig (Authentication & Middleware Role Guard Tests)', () => {
  const authorized = authConfig.callbacks?.authorized as unknown as (params: AuthorizedParams) => Response | boolean;
  const sessionCallback = authConfig.callbacks?.session as unknown as (params: {
    session: { user: { id?: string; role?: number; fullName?: string } };
    token: { id?: string; role?: number; fullName?: string };
  }) => Promise<{ user: { id?: string; role?: number; fullName?: string } }>;

  describe('callbacks.session', () => {
    it('ควรแนบ id, role, และ fullName จาก token เข้ากับ session.user', async () => {
      const session = { user: {} };
      const token = { id: '10', role: 1, fullName: 'สมชาย ใจดี' };

      const result = await sessionCallback({ session, token });
      expect(result.user.id).toBe('10');
      expect(result.user.role).toBe(1);
      expect(result.user.fullName).toBe('สมชาย ใจดี');
    });
  });

  describe('callbacks.authorized (Route & Role Guard)', () => {
    it('เมื่อยังไม่ได้เข้าสู่ระบบและเข้าหน้า root (/) ควร redirect ไปที่ /login', () => {
      const nextUrl = new URL('http://localhost:3000/');
      const result = authorized({
        auth: null,
        request: { nextUrl }
      });

      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(302);
      expect((result as Response).headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('เมื่อเข้าสู่ระบบด้วย Role 1 (ผู้ป่วย) และเข้าหน้า / หรือ /login ควร redirect ไป /user/games', () => {
      const nextUrl = new URL('http://localhost:3000/login');
      const result = authorized({
        auth: { user: { id: '10', role: 1 } },
        request: { nextUrl }
      });

      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(302);
      expect((result as Response).headers.get('location')).toBe('http://localhost:3000/user/games');
    });

    it('เมื่อเข้าสู่ระบบด้วย Role 2 (Admin) และเข้าหน้า / หรือ /login ควร redirect ไป /admin', () => {
      const nextUrl = new URL('http://localhost:3000/login');
      const result = authorized({
        auth: { user: { id: '1', role: 2 } },
        request: { nextUrl }
      });

      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(302);
      expect((result as Response).headers.get('location')).toBe('http://localhost:3000/admin');
    });

    it('เมื่อยังไม่ได้ Login และเรียก Admin API ควรได้ status 401 Unauthorized', async () => {
      const nextUrl = new URL('http://localhost:3000/api/admin/users');
      const result = authorized({
        auth: null,
        request: { nextUrl }
      });

      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(401);
      const json = await (result as Response).json();
      expect(json.message).toBe('Unauthorized');
    });

    it('เมื่อ Role 1 (ผู้ป่วย) พยายามเรียก Admin API ควรได้ status 403 Forbidden', async () => {
      const nextUrl = new URL('http://localhost:3000/api/admin/exercises');
      const result = authorized({
        auth: { user: { id: '10', role: 1 } },
        request: { nextUrl }
      });

      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(403);
      const json = await (result as Response).json();
      expect(json.message).toBe('Forbidden');
    });

    it('เมื่อยังไม่ได้ Login และเข้าหน้าผู้ป่วย (/user/games) ควร return false เพื่อ redirect ไป /login', () => {
      const nextUrl = new URL('http://localhost:3000/user/games');
      const result = authorized({
        auth: null,
        request: { nextUrl }
      });

      expect(result).toBe(false);
    });

    it('เมื่อ Role 1 (ผู้ป่วย) พยายามดูประวัติของผู้ป่วยท่านอื่น (/api/patient-history/99) ควรได้ status 403 Forbidden', () => {
      const nextUrl = new URL('http://localhost:3000/api/patient-history/99');
      const result = authorized({
        auth: { user: { id: '10', role: 1 } },
        request: { nextUrl }
      });

      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(403);
    });

    it('เมื่อ Role 1 (ผู้ป่วย) ดูประวัติของตนเอง (/api/patient-history/10) ควรผ่านฉลุย', () => {
      const nextUrl = new URL('http://localhost:3000/api/patient-history/10');
      const result = authorized({
        auth: { user: { id: '10', role: 1 } },
        request: { nextUrl }
      });

      expect(result).toBe(true);
    });
  });
});
