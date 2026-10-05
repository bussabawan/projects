// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AlertMessage from '@/app/components/AlertMessage/AlertMessage';

describe('AlertMessage (Component Tests)', () => {
  it('ไม่ควรแสดงผลเมื่อ show = false', () => {
    render(<AlertMessage type="success" show={false} />);
    expect(screen.queryByText('คำตอบถูกต้อง')).not.toBeInTheDocument();
  });

  it('ควรแสดงผลข้อความเริ่มต้นสำหรับ type="success"', () => {
    render(<AlertMessage type="success" />);
    expect(screen.getByText('คำตอบถูกต้อง')).toBeInTheDocument();
    expect(screen.getByText('กำลังไปข้อถัดไป...')).toBeInTheDocument();
  });

  it('ควรแสดงผลข้อความเริ่มต้นสำหรับ type="error"', () => {
    render(<AlertMessage type="error" />);
    expect(screen.getByText('คำตอบไม่ถูกต้อง')).toBeInTheDocument();
    expect(screen.getByText('กรุณาลองใหม่')).toBeInTheDocument();
  });

  it('ควรแสดงผล popup confirm พร้อมปุ่มตกลงและยกเลิกเมื่อ type="confirm"', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <AlertMessage 
        type="confirm" 
        line1="คุณต้องการออกจากเกมใช่หรือไม่?" 
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );

    expect(screen.getByText('คุณต้องการออกจากเกมใช่หรือไม่?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'ตกลง' }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'ยกเลิก' }));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
