/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ManageImagesPage from '@/app/admin/images/page';

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

// Mock window.Image to resolve preload immediately in jsdom
class MockImageElement {
  private _src = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  get src() {
    return this._src;
  }
  set src(val: string) {
    this._src = val;
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
}
window.Image = MockImageElement as unknown as typeof Image;

// Mock window.Audio
class MockAudioElement {
  preload = 'auto';
  constructor(public src: string) {}
  play = vi.fn();
  pause = vi.fn();
}
window.Audio = MockAudioElement as unknown as typeof Audio;

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: function MockImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || 'mock-image'} />;
  },
}));

// Mock ImageFormModal
vi.mock('@/app/admin/images/components/ImageFormModal', () => ({
  default: function MockImageFormModal({
    onSave,
    onClose,
  }: {
    onSave: (data: Record<string, unknown>) => void;
    onClose: () => void;
  }) {
    return (
      <div data-testid="mock-image-form-modal">
        <span>Mock Image Form Modal</span>
        <button
          onClick={() =>
            onSave({
              imageName: 'สิงโตตัวใหญ่',
              imageUrl: 'lion.jpg',
              speechText: 'สิงโต',
              useAutoSpeech: true,
            })
          }
        >
          บันทึกรูปภาพ
        </button>
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

describe('ManageImagesPage (Client Component Page)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation(async () => {
      return mockJsonResponse({ success: true, data: [], total: 0 });
    });
  });

  it('ควรเรนเดอร์และดึงรายการรูปภาพมาแสดงได้อย่างถูกต้อง', async () => {
    const mockImages = [
      { id: 1, title: 'รูปแมว', imageUrl: 'cat.jpg', audioUrl: 'cat.mp3' },
      { id: 2, title: 'รูปสุนัข', imageUrl: 'dog.jpg', audioUrl: 'dog.mp3' },
    ];

    vi.mocked(global.fetch).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/admin/images')) {
        return mockJsonResponse({
          success: true,
          data: mockImages,
          total: 2,
        });
      }
      return mockJsonResponse({});
    });

    render(<ManageImagesPage />);

    expect(screen.getByText('จัดการรูปภาพ')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('รูปแมว')).toBeInTheDocument();
      expect(screen.getByText('รูปสุนัข')).toBeInTheDocument();
    });
  });

  it('ควรเปิด Modal เพิ่มรูปภาพ และบันทึกข้อมูลรูปภาพใหม่ได้', async () => {
    render(<ManageImagesPage />);

    await waitFor(() => {
      expect(screen.queryByText('กำลังโหลดรูปภาพ...')).not.toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /เพิ่ม/i });
    fireEvent.click(addBtn);

    expect(screen.getByTestId('mock-image-form-modal')).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: 'บันทึกรูปภาพ' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/images',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('สิงโตตัวใหญ่'),
        })
      );
    });
  });

  it('ควรเปิด Modal ยืนยันการลบรูปภาพ และส่งคำขอ DELETE สำเร็จ', async () => {
    const mockImages = [{ id: 10, title: 'รูปภาพที่จะลบ', imageUrl: 'del.jpg' }];

    vi.mocked(global.fetch).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/admin/images')) {
        return mockJsonResponse({ success: true, data: mockImages, total: 1 });
      }
      return mockJsonResponse({ success: true });
    });

    render(<ManageImagesPage />);

    await waitFor(() => {
      expect(screen.getByText('รูปภาพที่จะลบ')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle(/ลบ/i);
    fireEvent.click(deleteBtn);

    const confirmDeleteBtn = screen.getByRole('button', { name: 'ตกลง' });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/images/10',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});
