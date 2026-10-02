// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BaseModal from '@/app/components/BaseModal/BaseModal';

describe('BaseModal (Component Tests)', () => {
  it('ไม่ควร render เนื้อหาเมื่อ isOpen = false', () => {
    render(
      <BaseModal isOpen={false} onClose={vi.fn()} title="หัวข้อ Modal">
        <div>เนื้อหาภายใน Modal</div>
      </BaseModal>
    );

    expect(screen.queryByText('หัวข้อ Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('เนื้อหาภายใน Modal')).not.toBeInTheDocument();
  });

  it('ควร render title, subtitle และ children เมื่อ isOpen = true', () => {
    render(
      <BaseModal 
        isOpen={true} 
        onClose={vi.fn()} 
        title="ตั้งค่าเกม" 
        subtitle="เลือกระดับความยาก"
      >
        <div>เนื้อหาการตั้งค่า</div>
      </BaseModal>
    );

    expect(screen.getByText('ตั้งค่าเกม')).toBeInTheDocument();
    expect(screen.getByText('เลือกระดับความยาก')).toBeInTheDocument();
    expect(screen.getByText('เนื้อหาการตั้งค่า')).toBeInTheDocument();
  });

  it('ควรเรียก onClose เมื่อคลิกปุ่มปิด (✕)', () => {
    const handleClose = vi.fn();
    render(
      <BaseModal isOpen={true} onClose={handleClose} title="หน้าต่างแจ้งเตือน">
        <div>รายละเอียด</div>
      </BaseModal>
    );

    const closeBtn = screen.getByRole('button', { name: 'Close modal' });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('ควรเรียก onClose เมื่อกดปุ่ม Escape บนแป้นพิมพ์', () => {
    const handleClose = vi.fn();
    render(
      <BaseModal isOpen={true} onClose={handleClose} title="หน้าต่างแจ้งเตือน">
        <div>รายละเอียด</div>
      </BaseModal>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
