import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/manuals/[filename]/route';
import { auth } from '@/auth';
import { existsSync } from 'fs';

vi.mock('@/auth', () => ({
  auth: vi.fn()
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  statSync: vi.fn(),
  createReadStream: vi.fn()
}));

describe('API Route /api/manuals/[filename] (Integration Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ควรตอบกลับ status 401 Unauthorized เมื่อไม่มี session', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/manuals/user-manual.pdf');
    const params = Promise.resolve({ filename: 'user-manual.pdf' });

    const res = await GET(req, { params });
    expect(res.status).toBe(401);
  });

  it('ควรตอบกลับ status 400 เมื่อชื่อไฟล์มีความพยายามทำ Directory Traversal', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: '1' },
      expires: '2099-01-01'
    });

    const req = new NextRequest('http://localhost:3000/api/manuals/..%2Fsecret.pdf');
    const params = Promise.resolve({ filename: '../secret.pdf' });

    const res = await GET(req, { params });
    expect(res.status).toBe(400);
  });

  it('ควรตอบกลับ status 404 เมื่อไม่พบไฟล์คู่มือในระบบ', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: '1' },
      expires: '2099-01-01'
    });
    vi.mocked(existsSync).mockReturnValueOnce(false);

    const req = new NextRequest('http://localhost:3000/api/manuals/not-found.pdf');
    const params = Promise.resolve({ filename: 'not-found.pdf' });

    const res = await GET(req, { params });
    expect(res.status).toBe(404);
  });
});
