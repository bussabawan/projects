/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ManageExercisesPage from '@/app/admin/exercises/page';

// Mock hooks
vi.mock('@/app/hooks/useDebounce', () => ({
  useDebounce: (val: string) => val,
}));

vi.mock('@/app/hooks/useScrollLock', () => ({
  useScrollLock: vi.fn(),
}));

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: function MockImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || 'mock-image'} />;
  },
}));

const mockJsonResponse = (data: unknown) =>
  Promise.resolve({
    ok: true,
    json: async () => data,
  } as unknown as Response);

describe('ManageExercisesPage (Client Component Page)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('ควรเรนเดอร์และดึงรายการชุดแบบฝึกหัดมาแสดงผลได้ถูกต้อง', async () => {
    const mockExercises = [
      { exercises_id: 1, exercises_name: 'แบบฝึกหัดหมวดสัตว์ เลเวล 1' },
      { exercises_id: 2, exercises_name: 'แบบฝึกหัดหมวดผลไม้ เลเวล 1' },
    ];

    vi.mocked(global.fetch).mockReturnValueOnce(
      mockJsonResponse({
        success: true,
        data: mockExercises,
        total: 2,
      })
    );

    render(<ManageExercisesPage />);

    expect(screen.getByText('จัดการแบบฝึกหัด')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('แบบฝึกหัดหมวดสัตว์ เลเวล 1')).toBeInTheDocument();
      expect(screen.getByText('แบบฝึกหัดหมวดผลไม้ เลเวล 1')).toBeInTheDocument();
    });
  });

  it('ควรเปิด Modal เพิ่มชุดแบบฝึกหัด และส่งคำขอ POST สำเร็จ', async () => {
    vi.mocked(global.fetch).mockReturnValueOnce(
      mockJsonResponse({ success: true, data: [], total: 0 })
    );

    render(<ManageExercisesPage />);

    await waitFor(() => {
      expect(screen.queryByText('กำลังโหลดข้อมูล...')).not.toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /เพิ่ม/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('เพิ่มชุดแบบฝึกหัด')).toBeInTheDocument();
    const label = screen.getByText('ชื่อชุดแบบฝึกหัด');
    const input = label.parentElement?.querySelector('input') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'แบบฝึกหัดหมวดกีฬา' } });

    vi.mocked(global.fetch)
      .mockReturnValueOnce(
        mockJsonResponse({ success: true, data: { exercises_name: 'แบบฝึกหัดหมวดกีฬา' } })
      )
      .mockReturnValueOnce(
        mockJsonResponse({
          success: true,
          data: [{ exercises_id: 3, exercises_name: 'แบบฝึกหัดหมวดกีฬา' }],
          total: 1,
        })
      );

    const saveBtn = screen.getByRole('button', { name: /^บันทึก$/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/exercises',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'แบบฝึกหัดหมวดกีฬา' }),
        })
      );
    });
  });

  it('ควรเปิด Modal แก้ไขชุดแบบฝึกหัด และส่งคำขอ PUT สำเร็จ', async () => {
    const mockExercises = [{ exercises_id: 1, exercises_name: 'แบบฝึกหัดชื่อเดิม' }];

    vi.mocked(global.fetch).mockReturnValueOnce(
      mockJsonResponse({ success: true, data: mockExercises, total: 1 })
    );

    render(<ManageExercisesPage />);

    await waitFor(() => {
      expect(screen.getByText('แบบฝึกหัดชื่อเดิม')).toBeInTheDocument();
    });

    const editBtn = screen.getByTitle(/แก้ไข/i);
    fireEvent.click(editBtn);

    const editInput = screen.getByDisplayValue('แบบฝึกหัดชื่อเดิม');
    expect(editInput).toBeInTheDocument();

    fireEvent.change(editInput, { target: { value: 'แบบฝึกหัดชื่อใหม่' } });

    vi.mocked(global.fetch).mockReturnValueOnce(
      mockJsonResponse({ success: true })
    );

    const saveEditBtn = screen.getByRole('button', { name: /^บันทึก$/i });
    fireEvent.click(saveEditBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/exercises/'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'แบบฝึกหัดชื่อใหม่' }),
        })
      );
    });
  });

  it('ควรเปิด Modal ยืนยันการลบ และส่งคำขอ DELETE สำเร็จ', async () => {
    const mockExercises = [{ exercises_id: 1, exercises_name: 'แบบฝึกหัดจะลบ' }];

    vi.mocked(global.fetch).mockReturnValueOnce(
      mockJsonResponse({ success: true, data: mockExercises, total: 1 })
    );

    render(<ManageExercisesPage />);

    await waitFor(() => {
      expect(screen.getByText('แบบฝึกหัดจะลบ')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle(/ลบ/i);
    fireEvent.click(deleteBtn);

    expect(screen.getByText('ยืนยันการลบชุดแบบฝึกหัด')).toBeInTheDocument();

    vi.mocked(global.fetch)
      .mockReturnValueOnce(mockJsonResponse({ success: true }))
      .mockReturnValueOnce(mockJsonResponse({ success: true, data: [], total: 0 }));

    const confirmDeleteBtn = screen.getByRole('button', { name: 'ตกลง' });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/exercises/'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});
