// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Footer from '@/app/components/Footer/Footer';

// Mock AboutModal
vi.mock('@/app/components/AboutModal/AboutModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? (
      <div data-testid="mock-about-modal">
        <span>ข้อมูลเกี่ยวกับผู้จัดทำ</span>
        <button onClick={onClose}>ปิด Modal</button>
      </div>
    ) : null
  ),
}));

describe('Footer (Component Tests)', () => {
  it('ควรเรนเดอร์ข้อความลิขสิทธิ์และสถาบันความร่วมมือครบถ้วน', () => {
    render(<Footer />);

    expect(screen.getAllByText(/© 2026 Cog-kit/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/โรงพยาบาลเวชชารักษ์ ลำปาง/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/มหาวิทยาลัยราชภัฏลำปาง/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/วิทยาลัยเทคนิคนครลำปาง/i).length).toBeGreaterThan(0);
  });

  it('ควรมีลิงก์เงื่อนไขการให้บริการและนโยบายความเป็นส่วนตัว', () => {
    render(<Footer />);

    const termsLink = screen.getByRole('link', { name: /เงื่อนไขการให้บริการ/i });
    expect(termsLink).toBeInTheDocument();
    expect(termsLink).toHaveAttribute('href', 'https://www.vjlh.go.th/about/structureIT');
    expect(termsLink).toHaveAttribute('target', '_blank');

    const privacyLink = screen.getByRole('link', { name: /นโยบายความเป็นส่วนตัว/i });
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute('href', 'https://www.vjlh.go.th/about/structureIT');
  });

  it('เมื่อกดปุ่ม "เกี่ยวกับผู้จัดทำ" ควรเปิด AboutModal ขึ้นมา และปิดได้เมื่อกดปุ่มปิด', () => {
    render(<Footer alwaysShowAbout={true} />);

    expect(screen.queryByTestId('mock-about-modal')).not.toBeInTheDocument();

    const aboutBtn = screen.getByRole('button', { name: /เกี่ยวกับผู้จัดทำ/i });
    fireEvent.click(aboutBtn);

    expect(screen.getByTestId('mock-about-modal')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /ปิด Modal/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByTestId('mock-about-modal')).not.toBeInTheDocument();
  });
});
