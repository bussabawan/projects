// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RestoreConfirmModal from '@/app/components/Admin/RestoreConfirmModal';

describe('RestoreConfirmModal (Component Tests)', () => {
  it('ควรแสดงผลข้อความแจ้งเตือนพบข้อมูลเดิมและปุ่มกู้คืนข้อมูล', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(<RestoreConfirmModal onConfirm={handleConfirm} onCancel={handleCancel} />);

    expect(screen.getByText('พบข้อมูลเดิมในระบบ')).toBeInTheDocument();
    expect(screen.getByText('ต้องการกู้คืนข้อมูลที่เคยลบหรือไม่')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'กู้คืนข้อมูล' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ยกเลิก' })).toBeInTheDocument();
  });

  it('ควรเรียก onConfirm เมื่อคลิกปุ่มกู้คืนข้อมูล และเรียก onCancel เมื่อคลิกปุ่มยกเลิก', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(<RestoreConfirmModal onConfirm={handleConfirm} onCancel={handleCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'กู้คืนข้อมูล' }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'ยกเลิก' }));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
