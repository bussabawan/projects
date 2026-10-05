/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ManageUsersPage from '@/app/admin/users/page';

// Mock hooks
vi.mock('@/app/hooks/useDebounce', () => ({
  useDebounce: (val: string) => val,
}));

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock UserFormModal
vi.mock('@/app/admin/users/components/UserFormModal', () => ({
  default: function MockUserFormModal({
    onSave,
    onClose,
    role,
  }: {
    onSave: () => void;
    onClose: () => void;
    role: number;
  }) {
    return (
      <div data-testid="mock-user-form-modal">
        <span>Mock User Form Modal (Role: {role})</span>
        <button onClick={() => onSave()}>บันทึกผู้ใช้</button>
        <button onClick={onClose}>ยกเลิก</button>
      </div>
    );
  },
}));

const mockJsonResponse = (data: unknown) =>
  Promise.resolve({
    ok: true,
    json: async () => data,
  } as unknown as Response);

describe('ManageUsersPage (Client Component Page)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('ควรเรนเดอร์และดึงรายการผู้ป่วยมาแสดงในแท็บแรกได้อย่างถูกต้อง', async () => {
    const mockUsers = [
      {
        user_id: 1,
        user_name: 'patient001',
        full_name: 'สมชาย ใจดี',
        role: 1,
        update_time: '2026-03-01T10:00:00Z',
        exercises_name: 'แบบฝึกหัดพื้นฐาน',
      },
    ];

    vi.mocked(global.fetch).mockReturnValueOnce(
      mockJsonResponse({
        success: true,
        data: mockUsers,
        total: 1,
      })
    );

    render(<ManageUsersPage />);

    expect(screen.getByText('จัดการผู้ใช้')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('สมชาย ใจดี').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('patient001').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('ควรสลับแท็บไปยังเจ้าหน้าที่ และดึงรายการเจ้าหน้าที่ (role=2)', async () => {
    const mockStaff = [
      {
        user_id: 2,
        user_name: 'staff001',
        full_name: 'พยาบาล สมศรี',
        role: 2,
        update_time: '2026-03-01T11:00:00Z',
      },
    ];

    // Initial fetch for patients
    vi.mocked(global.fetch)
      .mockReturnValueOnce(mockJsonResponse({ success: true, data: [], total: 0 }))
      // Second fetch for staff tab click
      .mockReturnValueOnce(mockJsonResponse({ success: true, data: mockStaff, total: 1 }));

    render(<ManageUsersPage />);

    await waitFor(() => {
      expect(screen.queryByText('กำลังโหลดข้อมูล...')).not.toBeInTheDocument();
    });

    const staffTab = screen.getByRole('button', { name: 'เจ้าหน้าที่' });
    fireEvent.click(staffTab);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users?role=2'),
        expect.anything()
      );
      expect(screen.getAllByText('พยาบาล สมศรี').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('ควรเปิด Modal เพิ่มผู้ใช้ และสามารถบันทึกข้อมูลได้', async () => {
    vi.mocked(global.fetch).mockReturnValueOnce(
      mockJsonResponse({ success: true, data: [], total: 0 })
    );

    render(<ManageUsersPage />);

    await waitFor(() => {
      expect(screen.queryByText('กำลังโหลดข้อมูล...')).not.toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /เพิ่ม/i });
    fireEvent.click(addBtn);

    expect(screen.getByTestId('mock-user-form-modal')).toBeInTheDocument();

    vi.mocked(global.fetch).mockReturnValueOnce(
      mockJsonResponse({ success: true, data: [], total: 0 })
    );

    const saveBtn = screen.getByRole('button', { name: 'บันทึกผู้ใช้' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('mock-user-form-modal')).not.toBeInTheDocument();
    });
  });

  it('ควรเปิด Modal ยืนยันการลบผู้ใช้ และส่งคำขอ DELETE สำเร็จ', async () => {
    const mockUsers = [
      {
        user_id: 10,
        user_name: 'deluser',
        full_name: 'คนไข้ทดสอบลบ',
        role: 1,
        update_time: '2026-03-01T10:00:00Z',
      },
    ];

    vi.mocked(global.fetch).mockReturnValueOnce(
      mockJsonResponse({ success: true, data: mockUsers, total: 1 })
    );

    render(<ManageUsersPage />);

    await waitFor(() => {
      expect(screen.getAllByText('คนไข้ทดสอบลบ').length).toBeGreaterThanOrEqual(1);
    });

    const deleteBtn = screen.getAllByTitle('ลบ')[0];
    fireEvent.click(deleteBtn);

    expect(screen.getByText('ยืนยันการลบข้อมูลผู้ป่วย')).toBeInTheDocument();

    vi.mocked(global.fetch)
      .mockReturnValueOnce(mockJsonResponse({ success: true }))
      .mockReturnValueOnce(mockJsonResponse({ success: true, data: [], total: 0 }));

    const confirmDeleteBtn = screen.getByRole('button', { name: 'ตกลง' });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/users/10',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});
