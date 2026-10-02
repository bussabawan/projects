// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AlertModal from '@/app/components/Admin/AlertModal';

describe('AlertModal (Component Tests)', () => {
  it('ควรแสดงผล title และปุ่มตกลงอย่างถูกต้อง', () => {
    const handleConfirm = vi.fn();
    render(<AlertModal title="บันทึกข้อมูลเรียบร้อยแล้ว" onConfirm={handleConfirm} />);

    expect(screen.getByText('บันทึกข้อมูลเรียบร้อยแล้ว')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ตกลง' })).toBeInTheDocument();
  });

  it('ควรเรียก onConfirm เมื่อคลิกปุ่มตกลง', () => {
    const handleConfirm = vi.fn();
    render(<AlertModal title="ข้อความแจ้งเตือน" onConfirm={handleConfirm} />);

    const confirmBtn = screen.getByRole('button', { name: 'ตกลง' });
    fireEvent.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
