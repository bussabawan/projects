// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLayout from '@/app/admin/layout';
import { getSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

vi.mock('next-auth/react', () => ({
  getSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt || 'mock-image'} />
  ),
}));

vi.mock('@/app/components/Loader/Loader', () => ({
  default: ({ text }: { text?: string }) => <div data-testid="loader">{text}</div>,
}));

vi.mock('@/app/components/AboutModal/AboutModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="about-modal">
        About Modal Content
        <button onClick={onClose} data-testid="close-about-btn">
          Close
        </button>
      </div>
    ) : null,
}));

vi.mock('@/app/components/Footer/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('AdminLayout (src/app/admin/layout.tsx)', () => {
  const mockReplace = vi.fn();
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      replace: mockReplace,
      push: mockPush,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(usePathname).mockReturnValue('/admin');
  });

  it('shows loader and redirects to /login if unauthenticated', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);

    render(
      <AdminLayout>
        <div>Admin Content</div>
      </AdminLayout>
    );

    expect(screen.getByTestId('loader')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('redirects role 1 (patient) to /user/games after brief delay', async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
      user: { id: 'patient-1', role: 1 },
      expires: '2099-01-01',
    });

    render(
      <AdminLayout>
        <div>Admin Content</div>
      </AdminLayout>
    );

    expect(screen.getByTestId('loader')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(mockReplace).toHaveBeenCalledWith('/user/games');
      },
      { timeout: 2000 }
    );
  });

  it('authorizes role 2 (admin) and renders sidebar and content', async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
      user: { id: 'admin-1', role: 2, fullName: 'สมชาย ผู้ดูแล' },
      expires: '2099-01-01',
    });

    render(
      <AdminLayout>
        <div data-testid="admin-child">Admin Content</div>
      </AdminLayout>
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-child')).toBeInTheDocument();
    });

    expect(screen.getByText('คุณ สมชาย ผู้ดูแล')).toBeInTheDocument();
    expect(screen.getByText('ภาพรวมสถิติ')).toBeInTheDocument();
    expect(screen.getByText('สถิติผู้ป่วยรายบุคคล')).toBeInTheDocument();
    expect(screen.getByText('จัดการผู้ใช้')).toBeInTheDocument();
    expect(screen.getByText('จัดการรูปภาพ')).toBeInTheDocument();
    expect(screen.getByText('จัดการหมวดหมู่')).toBeInTheDocument();
    expect(screen.getByText('จัดการแบบฝึก')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('toggles sidebar collapse state and opens/closes about modal', async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
      user: { id: 'admin-1', role: 2, name: 'Admin Test' },
      expires: '2099-01-01',
    });

    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('คุณ Admin Test')).toBeInTheDocument();
    });

    const toggleBtn = screen.getByLabelText('Toggle Sidebar');
    fireEvent.click(toggleBtn);

    // Open About Modal
    const aboutBtn = screen.getByText('ผู้จัดทำ');
    fireEvent.click(aboutBtn);
    expect(screen.getByTestId('about-modal')).toBeInTheDocument();

    // Close About Modal
    fireEvent.click(screen.getByTestId('close-about-btn'));
    expect(screen.queryByTestId('about-modal')).not.toBeInTheDocument();
  });

  it('handles manual logout when clicking logout button', async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
      user: { id: 'admin-1', role: 2, name: 'Admin Test' },
      expires: '2099-01-01',
    });

    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('คุณ Admin Test')).toBeInTheDocument();
    });

    // Manual logout button
    const logoutBtn = screen.getByRole('button', { name: 'Logout' });
    fireEvent.click(logoutBtn);
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
  });
});
