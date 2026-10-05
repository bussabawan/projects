// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserFormModal from '@/app/admin/users/components/UserFormModal';

describe('UserFormModal (Component Tests)', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation(async (url: string | URL | Request) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/admin/exercises')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: [
              { exercises_id: 1, exercises_name: 'แบบฝึกหัดสัตว์' },
              { exercises_id: 2, exercises_name: 'แบบฝึกหัดผลไม้' },
            ],
          }),
        } as Response;
      }
      if (urlStr.includes('/api/admin/users')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { user_id: 10 },
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({ success: true }),
      } as Response;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ควรเรนเดอร์ฟอร์มเพิ่มคนไข้ (Role 1) และโหลดรายการชุดแบบฝึกหัด', async () => {
    render(
      <UserFormModal
        user={null}
        role={1}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('เพิ่มข้อมูลผู้ป่วย')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('แบบฝึกหัดสัตว์')).toBeInTheDocument();
      expect(screen.getByText('แบบฝึกหัดผลไม้')).toBeInTheDocument();
    });
  });

  it('เมื่อกดบันทึกโดยไม่เลือกชุดแบบฝึกหัด (Role 1) ควรแสดงข้อความแจ้งเตือน error', async () => {
    render(
      <UserFormModal
        user={null}
        role={1}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('แบบฝึกหัดสัตว์')).toBeInTheDocument();
    });

    const form = screen.getByText('บันทึก').closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText('กรุณาเลือกชุดแบบฝึกหัดเริ่มต้นอย่างน้อย 1 ชุด')).toBeInTheDocument();
    });
  });

  it('เมื่อส่งฟอร์มสำเร็จ (แก้ไขผู้ใช้) ควรส่งคำขอ PUT และเรียก onSave', async () => {
    const existingUser = {
      user_id: 10,
      user_name: 'patient01',
      full_name: 'สมชาย ใจดี',
      role: 1,
      exercises_id: 1,
    };

    render(
      <UserFormModal
        user={existingUser}
        role={1}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('แบบฝึกหัดสัตว์')).toBeInTheDocument();
    });

    const form = screen.getByText('บันทึก').closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 10,
          user_name: 'patient01',
          full_name: 'สมชาย ใจดี',
        }),
        10
      );
    });
  });

  it('เมื่อกดปุ่มยกเลิก ควรเรียก onClose', () => {
    render(
      <UserFormModal
        user={null}
        role={2}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const cancelBtn = screen.getByText('ยกเลิก');
    fireEvent.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
