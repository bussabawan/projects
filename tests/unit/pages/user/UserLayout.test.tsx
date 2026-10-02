// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserLayout from '@/app/user/layout';
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
  default: ({ alwaysShowAbout }: { alwaysShowAbout?: boolean }) => (
    <footer data-testid="footer" data-always-about={alwaysShowAbout ? 'true' : 'false'}>
      Footer
    </footer>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('UserLayout (src/app/user/layout.tsx)', () => {
  const mockReplace = vi.fn();
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      replace: mockReplace,
      push: mockPush,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(usePathname).mockReturnValue('/user/games');
  });

  it('shows loader and redirects to /login if unauthenticated', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);

    render(
      <UserLayout>
        <div>User Content</div>
      </UserLayout>
    );

    expect(screen.getByTestId('loader')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('redirects role 2 (admin) to /admin after brief delay', async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
      user: { id: 'admin-1', role: 2 },
      expires: '2099-01-01',
    });

    render(
      <UserLayout>
        <div>User Content</div>
      </UserLayout>
    );

    expect(screen.getByTestId('loader')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(mockReplace).toHaveBeenCalledWith('/admin');
      },
      { timeout: 2000 }
    );
  });

  it('authorizes role 1 (patient) and renders user sidebar and navigation', async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
      user: { id: 'patient-1', role: 1, fullName: 'วิชัย สมบูรณ์' },
      expires: '2099-01-01',
    });

    render(
      <UserLayout>
        <div data-testid="user-child">Game Menu</div>
      </UserLayout>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-child')).toBeInTheDocument();
    });

    expect(screen.getAllByText('วิชัย สมบูรณ์').length).toBeGreaterThan(0);
    expect(screen.getByText('ประเภทเกม')).toBeInTheDocument();
    expect(screen.getByText('ประวัติการฝึก')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('toggles sidebar collapse state and handles about modal', async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
      user: { id: 'patient-1', role: 1, fullName: 'วิชัย สมบูรณ์' },
      expires: '2099-01-01',
    });

    render(
      <UserLayout>
        <div>Content</div>
      </UserLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('ประเภทเกม')).toBeInTheDocument();
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

  it('handles user logout correctly', async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
      user: { id: 'patient-1', role: 1, fullName: 'วิชัย สมบูรณ์' },
      expires: '2099-01-01',
    });

    render(
      <UserLayout>
        <div>Content</div>
      </UserLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('ประเภทเกม')).toBeInTheDocument();
    });

    const logoutBtns = screen.getAllByRole('button', { name: 'Logout' });
    fireEvent.click(logoutBtns[0]);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith({ redirect: false });
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('renders game inner page mode without sidebar for deep game paths', async () => {
    vi.mocked(usePathname).mockReturnValue('/user/games/matching/play');
    vi.mocked(getSession).mockResolvedValueOnce({
      user: { id: 'patient-1', role: 1, fullName: 'วิชัย สมบูรณ์' },
      expires: '2099-01-01',
    });

    render(
      <UserLayout>
        <div data-testid="game-playing">Playing Game</div>
      </UserLayout>
    );

    await waitFor(() => {
      expect(screen.getByTestId('game-playing')).toBeInTheDocument();
    });

    // Sidebar and mobileHeader should not be present in game inner page
    expect(screen.queryByLabelText('Toggle Sidebar')).not.toBeInTheDocument();
    expect(screen.queryByText('ประเภทเกม')).not.toBeInTheDocument();
  });
});
