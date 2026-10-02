import { vi, afterEach } from 'vitest';

// Global Mocks สำหรับ Next.js 16 App Router
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: vi.fn((fn) => fn)
}));

// Mock Next.js Navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn()
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams())
}));

// ทำความสะอาด Mock ทุกครั้งหลังเสร็จแต่ละการทดสอบ
afterEach(() => {
  vi.clearAllMocks();
});
