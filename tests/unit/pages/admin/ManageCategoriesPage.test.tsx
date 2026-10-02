/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ManageCategoriesPage from '@/app/admin/categories/page';

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

describe('ManageCategoriesPage (Client Component Page)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('ควรเรนเดอร์และดึงรายการหมวดหมู่มาแสดงได้ถูกต้อง', async () => {
    const mockCategories = [
      { category_id: 1, category_name: 'สัตว์บก' },
      { category_id: 2, category_name: 'ผลไม้' },
    ];

    vi.mocked(global.fetch).mockReturnValueOnce(
      mockJsonResponse({
        success: true,
        data: mockCategories,
        total: 2,
      })
    );

    render(<ManageCategoriesPage />);

    expect(screen.getByText('จัดการหมวดหมู่')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('สัตว์บก')).toBeInTheDocument();
      expect(screen.getByText('ผลไม้')).toBeInTheDocument();
    });
  });

  it('ควรเปิด Modal เพิ่มหมวดหมู่ และสามารถบันทึกหมวดหมู่ใหม่ได้', async () => {
    // Initial fetch
    vi.mocked(global.fetch).mockReturnValueOnce(
      mockJsonResponse({ success: true, data: [], total: 0 })
    );

    render(<ManageCategoriesPage />);

    await waitFor(() => {
      expect(screen.queryByText('กำลังโหลดข้อมูล...')).not.toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /เพิ่ม/i });
    fireEvent.click(addBtn);

    // Modal opens
    expect(screen.getByText('เพิ่มหมวดหมู่')).toBeInTheDocument();
    const label = screen.getByText('ชื่อหมวดหมู่');
    const input = label.parentElement?.querySelector('input') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'ยานพาหนะ' } });

    // Mock POST call and refetch
    vi.mocked(global.fetch)
      .mockReturnValueOnce(
        mockJsonResponse({ success: true, data: { category_name: 'ยานพาหนะ' } })
      )
      .mockReturnValueOnce(
        mockJsonResponse({
          success: true,
          data: [{ category_id: 3, category_name: 'ยานพาหนะ' }],
          total: 1,
        })
      );

    const saveBtn = screen.getByRole('button', { name: /^บันทึก$/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/categories',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'ยานพาหนะ' }),
        })
      );
    });
  });

  it('ควรเปิด Modal แก้ไขหมวดหมู่ และสามารถส่งคำขอแก้ไขได้', async () => {
    const mockCategories = [{ category_id: 1, category_name: 'สัตว์ปีก' }];

    vi.mocked(global.fetch).mockReturnValueOnce(
      mockJsonResponse({ success: true, data: mockCategories, total: 1 })
    );

    render(<ManageCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('สัตว์ปีก')).toBeInTheDocument();
    });

    // Click edit button
    const editBtn = screen.getByTitle(/แก้ไข/i);
    fireEvent.click(editBtn);

    const editInput = screen.getByDisplayValue('สัตว์ปีก');
    expect(editInput).toBeInTheDocument();

    fireEvent.change(editInput, { target: { value: 'นกและสัตว์ปีก' } });

    // Mock PUT update
    vi.mocked(global.fetch).mockReturnValueOnce(
      mockJsonResponse({ success: true })
    );

    const saveEditBtn = screen.getByRole('button', { name: /^บันทึก$/i });
    fireEvent.click(saveEditBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/categories/'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'นกและสัตว์ปีก' }),
        })
      );
    });
  });

  it('ควรเปิด Modal ยืนยันการลบ และส่งคำขอ DELETE ได้สำเร็จ', async () => {
    const mockCategories = [{ category_id: 1, category_name: 'หมวดทดสอบลบ' }];

    vi.mocked(global.fetch).mockReturnValueOnce(
      mockJsonResponse({ success: true, data: mockCategories, total: 1 })
    );

    render(<ManageCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('หมวดทดสอบลบ')).toBeInTheDocument();
    });

    // Click delete button
    const deleteBtn = screen.getByTitle(/ลบ/i);
    fireEvent.click(deleteBtn);

    expect(screen.getByText('ยืนยันการลบหมวดหมู่')).toBeInTheDocument();

    // Mock DELETE call and refetch
    vi.mocked(global.fetch)
      .mockReturnValueOnce(mockJsonResponse({ success: true }))
      .mockReturnValueOnce(mockJsonResponse({ success: true, data: [], total: 0 }));

    const confirmDeleteBtn = screen.getByRole('button', { name: 'ตกลง' });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/categories/'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});
