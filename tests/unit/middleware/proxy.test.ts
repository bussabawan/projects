import { describe, it, expect, vi } from 'vitest';

const mockAuthFunction = vi.fn();

vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    auth: mockAuthFunction,
  })),
}));

describe('Next.js 16 Proxy Middleware (proxy.ts)', () => {
  it('exports proxy function and matcher config properly', async () => {
    const proxyModule = await import('@/../proxy');

    expect(proxyModule.proxy).toBe(mockAuthFunction);
    expect(proxyModule.config).toBeDefined();
    expect(proxyModule.config.matcher).toEqual([
      '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    ]);
  });
});
