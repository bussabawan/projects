// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import AboutModal from '@/app/components/AboutModal/AboutModal';

describe('AboutModal (Component Tests)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ควรแสดงผลข้อมูลผู้จัดทำและสถาบันความร่วมมือเมื่อเปิด Modal', async () => {
    render(<AboutModal isOpen={true} onClose={vi.fn()} />);

    // เร่ง setTimeout ของ mounted state
    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByText('เกี่ยวกับผู้จัดทำ ปี 2569')).toBeInTheDocument();
    expect(screen.getByText('COOPERATION BETWEEN')).toBeInTheDocument();
    expect(screen.getByText('โรงพยาบาลเวชชารักษ์ ลำปาง')).toBeInTheDocument();
    expect(screen.getByText('มหาวิทยาลัยราชภัฏลำปาง')).toBeInTheDocument();
    expect(screen.getByText('วิทยาลัยเทคนิคนครลำปาง')).toBeInTheDocument();
    expect(screen.getByText('นางสาวบุษบาวรรณ ลาพิงค์')).toBeInTheDocument();
    expect(screen.getByText('นายอภิรักษ์ เทพธรรม')).toBeInTheDocument();
  });

  it('ไม่ควร render สิ่งใดเมื่อ isOpen = false', async () => {
    render(<AboutModal isOpen={false} onClose={vi.fn()} />);

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.queryByText('COOPERATION BETWEEN')).not.toBeInTheDocument();
  });
});
