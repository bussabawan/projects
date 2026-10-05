// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DeleteConfirmModal from '@/app/components/Admin/DeleteConfirmModal';

describe('DeleteConfirmModal (Component Tests)', () => {
  it('ควรแสดงผล default title และปุ่มยืนยัน/ยกเลิก', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(<DeleteConfirmModal onConfirm={handleConfirm} onCancel={handleCancel} />);

    expect(screen.getByText('ยืนยันการลบข้อมูลรูปภาพ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ตกลง' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ยกเลิก' })).toBeInTheDocument();
  });

  it('ควรแสดงผล custom title เมื่อมีการส่ง props เข้ามา', () => {
    render(<DeleteConfirmModal onConfirm={vi.fn()} onCancel={vi.fn()} title="ยืนยันการลบผู้ใช้งาน" />);
    expect(screen.getByText('ยืนยันการลบผู้ใช้งาน')).toBeInTheDocument();
  });

  it('ควรเรียก onConfirm เมื่อคลิกปุ่มตกลง และเรียก onCancel เมื่อคลิกปุ่มยกเลิก', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(<DeleteConfirmModal onConfirm={handleConfirm} onCancel={handleCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'ตกลง' }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'ยกเลิก' }));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
