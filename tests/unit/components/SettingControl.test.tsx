// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingControl from '@/app/components/SettingControl/SettingControl';

describe('SettingControl (Component Tests)', () => {
  const defaultProps = {
    label: 'ระดับเสียง',
    value: 5,
    setter: vi.fn(),
    min: 1,
    max: 10,
    startHold: vi.fn(),
    stopHold: vi.fn(),
  };

  it('ควรเรนเดอร์ label, ค่าตัวเลขปัจจุบัน, และปุ่มบวก-ลบ ได้อย่างถูกต้อง', () => {
    render(<SettingControl {...defaultProps} />);

    expect(screen.getByText('ระดับเสียง')).toBeInTheDocument();
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input.value).toBe('5');
    expect(input.readOnly).toBe(true);
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.getByText('+')).toBeInTheDocument();
  });

  it('เมื่อกดปุ่มลบ (-) ควรเรียก startHold ด้วย delta = -1', () => {
    render(<SettingControl {...defaultProps} />);

    const minusBtn = screen.getByText('-');
    fireEvent.pointerDown(minusBtn);
    expect(defaultProps.startHold).toHaveBeenCalledWith(
      defaultProps.setter,
      5,
      -1,
      1,
      10
    );

    fireEvent.pointerUp(minusBtn);
    expect(defaultProps.stopHold).toHaveBeenCalled();
  });

  it('เมื่อกดปุ่มบวก (+) ควรเรียก startHold ด้วย delta = 1', () => {
    render(<SettingControl {...defaultProps} />);

    const plusBtn = screen.getByText('+');
    fireEvent.pointerDown(plusBtn);
    expect(defaultProps.startHold).toHaveBeenCalledWith(
      defaultProps.setter,
      5,
      1,
      1,
      10
    );

    fireEvent.pointerLeave(plusBtn);
    expect(defaultProps.stopHold).toHaveBeenCalled();
  });

  it('ควรปิดการใช้งานปุ่มลบ (disabled) เมื่อค่าปัจจุบันเท่ากับหรือน้อยกว่า min', () => {
    render(<SettingControl {...defaultProps} value={1} min={1} />);

    const minusBtn = screen.getByText('-');
    const plusBtn = screen.getByText('+');

    expect(minusBtn).toBeDisabled();
    expect(plusBtn).not.toBeDisabled();
  });

  it('ควรปิดการใช้งานปุ่มบวก (disabled) เมื่อค่าปัจจุบันเท่ากับหรือมากกว่า max', () => {
    render(<SettingControl {...defaultProps} value={10} max={10} />);

    const minusBtn = screen.getByText('-');
    const plusBtn = screen.getByText('+');

    expect(minusBtn).not.toBeDisabled();
    expect(plusBtn).toBeDisabled();
  });
});
