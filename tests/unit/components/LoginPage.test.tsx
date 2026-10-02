// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/login/page';
import { signIn } from 'next-auth/react';
import { checkUserLoginQuota } from '@/app/actions/authActions';

const mockPush = vi.fn();
const mockRefresh = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

vi.mock('@/app/actions/authActions', () => ({
  checkUserLoginQuota: vi.fn().mockResolvedValue({ isLocked: false, remainingAttempts: 10 }),
}));

vi.mock('@/app/components/AboutModal/AboutModal', () => ({
  default: () => null,
}));

vi.mock('@/app/components/Footer/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}));

describe('LoginPage (Component Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('ควรเรนเดอร์ฟอร์มเข้าสู่ระบบและปุ่มล็อกอินด้วย Google', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Log in$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log in with Google/i })).toBeInTheDocument();
  });

  it('เมื่อกดปุ่มเข้าสู่ระบบด้วย Google ควรเรียก signIn ด้วย provider google และ callbackUrl /', () => {
    render(<LoginPage />);

    const googleBtn = screen.getByRole('button', { name: /Log in with Google/i });
    fireEvent.click(googleBtn);

    expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/' });
  });

  it('เมื่อไม่ได้กรอกชื่อผู้ใช้หรือรหัสผ่านและกดเข้าสู่ระบบ ควรแสดงข้อความแจ้งเตือนที่ placeholder', async () => {
    render(<LoginPage />);

    const submitBtn = screen.getByRole('button', { name: /^Log in$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('โปรดกรอก Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('โปรดกรอก Password')).toBeInTheDocument();
    });
    expect(signIn).not.toHaveBeenCalled();
  });

  it('เมื่อกรอกชื่อผู้ใช้และรหัสผ่านถูกต้อง ควรเรียก signIn(credentials)', async () => {
    vi.mocked(signIn).mockResolvedValueOnce({
      error: null,
      status: 200,
      ok: true,
      url: '/',
    });

    render(<LoginPage />);

    const userInput = screen.getByLabelText('Username');
    const pwdInput = screen.getByLabelText('Password');
    const submitBtn = screen.getByRole('button', { name: /^Log in$/i });

    fireEvent.change(userInput, { target: { value: 'patient01' } });
    fireEvent.change(pwdInput, { target: { value: 'pass1234' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        redirect: false,
        username: 'patient01',
        password: 'pass1234',
      });
    });
  });

  it('เมื่อตรวจสอบพบว่าบัญชีถูกล็อก (isLocked: true) ควรแสดงข้อความแจ้งเตือนรหัสผิดเกิน 10 ครั้ง', async () => {
    vi.mocked(checkUserLoginQuota).mockResolvedValueOnce({
      isLocked: true,
      remainingAttempts: 0,
    });

    render(<LoginPage />);

    const userInput = screen.getByLabelText('Username');
    fireEvent.change(userInput, { target: { value: 'locked_user' } });
    fireEvent.blur(userInput);

    await waitFor(() => {
      expect(screen.getByText(/คุณใส่รหัสผิดเกิน 10 ครั้ง/i)).toBeInTheDocument();
    });
  });
});
