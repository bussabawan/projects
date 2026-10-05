// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CookieBanner from '@/app/components/CookieBanner/CookieBanner';

describe('CookieBanner (Component Tests)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ควรแสดงแถบ Cookie เมื่อยังไม่เคยกดยอมรับ', () => {
    render(<CookieBanner />);

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByText(/เราใช้คุกกี้เพื่อเพิ่มประสบการณ์และความพึงพอใจในการใช้งานเว็บไซต์/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ยอมรับ' })).toBeInTheDocument();
  });

  it('ไม่ควรแสดงแถบ Cookie เมื่อเคยยินยอมไปแล้วใน localStorage', () => {
    localStorage.setItem('cookieConsent', 'true');

    render(<CookieBanner />);

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.queryByRole('button', { name: 'ยอมรับ' })).not.toBeInTheDocument();
  });

  it('ควรบันทึกค่าลง localStorage และปิดแถบ Cookie เมื่อคลิกปุ่มยอมรับ', () => {
    render(<CookieBanner />);

    act(() => {
      vi.runAllTimers();
    });

    const acceptBtn = screen.getByRole('button', { name: 'ยอมรับ' });
    fireEvent.click(acceptBtn);

    expect(localStorage.getItem('cookieConsent')).toBe('true');
    expect(screen.queryByRole('button', { name: 'ยอมรับ' })).not.toBeInTheDocument();
  });
});
