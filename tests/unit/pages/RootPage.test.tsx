import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from '@/app/page';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

describe('Root Page (src/app/page.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /login when session is null', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    await Home();

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('redirects to /login when session has no user', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      expires: '2099-01-01',
    });

    await Home();

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('redirects to /user/games when user role is 1 (patient)', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'patient-1', name: 'User Patient', role: 1 },
      expires: '2099-01-01',
    });

    await Home();

    expect(redirect).toHaveBeenCalledWith('/user/games');
  });

  it('redirects to /admin when user role is 2 or staff', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'admin-1', name: 'Admin Staff', role: 2 },
      expires: '2099-01-01',
    });

    await Home();

    expect(redirect).toHaveBeenCalledWith('/admin');
  });
});
