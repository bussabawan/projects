/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HistoryPage from '@/app/user/history/page';

vi.mock('next-auth/react', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/app/components/HistoryModal/HistoryModal', () => ({
  default: function MockHistoryModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: unknown }) {
    if (!isOpen || !data) return null;
    return (
      <div data-testid="mock-history-modal">
        <span>History Modal Active</span>
        <button onClick={onClose}>ปิดประวัติ</button>
      </div>
    );
  },
}));

vi.mock('@/app/components/DatePicker/DatePicker', () => ({
  default: function MockDatePicker({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-date-picker">
        <button onClick={onClose}>ปิดปฏิทิน</button>
      </div>
    );
  },
}));

const mockJsonResponse = (data: unknown) =>
  Promise.resolve({
    ok: true,
    json: async () => data,
  } as unknown as Response);

describe('UserHistoryPage (Client Component Page)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getSession } = await import('next-auth/react');
    vi.mocked(getSession).mockResolvedValue({
      user: { id: '99', name: 'คนไข้ตัวอย่าง' },
      expires: '2099-01-01',
    });
    global.fetch = vi.fn();
  });

  it('ควรเรนเดอร์หน้าประวัติการฝึก และแสดงข้อมูลประวัติที่ดึงมาได้', async () => {
    const mockDailyStats = {
      dailyStats: [
        {
          dateStr: '2026-03-01',
          plays: 3,
          totalMinutes: 15,
          details: [
            { id: 1, timeStr: '10:00', mode: 'จับคู่', score: 100, duration: 300 },
          ],
        },
      ],
      totalPages: 1,
    };

    vi.mocked(global.fetch).mockReturnValueOnce(mockJsonResponse(mockDailyStats));

    render(<HistoryPage />);

    expect(screen.getByText('ประวัติการฝึก')).toBeInTheDocument();
    expect(screen.getByText('วันที่ฝึก')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/3 ครั้ง/i)).toBeInTheDocument();
      expect(screen.getByText(/รวม 15 นาที/i)).toBeInTheDocument();
    });
  });

  it('เมื่อคลิกแถวประวัติ ควรเปิด HistoryModal เพื่อดูรายละเอียดการเล่น', async () => {
    const mockDailyStats = {
      dailyStats: [
        {
          dateStr: '2026-03-02',
          plays: 2,
          totalMinutes: 10,
          details: [],
        },
      ],
      totalPages: 1,
    };

    vi.mocked(global.fetch).mockReturnValueOnce(mockJsonResponse(mockDailyStats));

    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText(/รวม 10 นาที/i)).toBeInTheDocument();
    });

    const row = screen.getByText(/รวม 10 นาที/i);
    fireEvent.click(row);

    expect(screen.getByTestId('mock-history-modal')).toBeInTheDocument();

    // Close modal
    const closeBtn = screen.getByRole('button', { name: 'ปิดประวัติ' });
    fireEvent.click(closeBtn);

    expect(screen.queryByTestId('mock-history-modal')).not.toBeInTheDocument();
  });

  it('เมื่อไม่มีข้อมูลประวัติ ควรแสดงข้อความ "ไม่มีข้อมูลในช่วงเวลานี้"', async () => {
    vi.mocked(global.fetch).mockReturnValueOnce(
      mockJsonResponse({ dailyStats: [], totalPages: 1 })
    );

    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('ไม่มีข้อมูลในช่วงเวลานี้')).toBeInTheDocument();
    });
  });
});
