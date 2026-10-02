/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PatientStatsPage from '@/app/admin/patient-stats/page';

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

// Mock PatientStatsPopup
vi.mock('@/app/admin/patient-stats/components/PatientStatsPopup', () => ({
  default: function MockPatientStatsPopup({
    isOpen,
    onClose,
    patientId,
    exerciseSets,
  }: {
    isOpen: boolean;
    onClose: () => void;
    patientId?: string;
    exerciseSets?: string[];
  }) {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-patient-stats-popup">
        <span>Patient Stats Popup for ID: {patientId}</span>
        <span>Exercise Sets Count: {exerciseSets?.length || 0}</span>
        <button onClick={onClose}>ปิดหน้าต่าง</button>
      </div>
    );
  },
}));

const mockJsonResponse = (data: unknown) =>
  Promise.resolve({
    ok: true,
    json: async () => data,
  } as unknown as Response);

describe('PatientStatsPage (Client Component Page)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('ควรเรนเดอร์และดึงรายการสถิติคนไข้มาแสดงในตารางได้อย่างถูกต้อง', async () => {
    const mockData = [
      {
        id: '1',
        patientId: 'PT001',
        name: 'นายกิตติคุณ มั่งมี',
        testSets: ['แบบฝึกหัดหมวดสัตว์ เลเวล 1'],
        playedSets: ['แบบฝึกหัดหมวดสัตว์ เลเวล 1'],
        assignedSets: ['แบบฝึกหัดหมวดสัตว์ เลเวล 1'],
      },
    ];

    vi.mocked(global.fetch).mockReturnValueOnce(mockJsonResponse(mockData));

    render(<PatientStatsPage />);

    expect(screen.getByText('สถิติผู้ป่วยรายบุคคล')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('นายกิตติคุณ มั่งมี').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('PT001').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('ควรเปิด Popup รายละเอียดสถิติผู้ป่วยเมื่อคลิกที่แถวหรือปุ่มในตาราง', async () => {
    const mockData = [
      {
        id: '1',
        patientId: 'PT001',
        name: 'นายกิตติคุณ มั่งมี',
        testSets: ['หมวดสัตว์'],
        playedSets: [],
        assignedSets: [],
      },
    ];

    vi.mocked(global.fetch).mockReturnValueOnce(mockJsonResponse(mockData));

    render(<PatientStatsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('นายกิตติคุณ มั่งมี').length).toBeGreaterThanOrEqual(1);
    });

    const playBtn = screen.getAllByRole('button', { name: 'Play' })[0];
    fireEvent.click(playBtn);

    expect(screen.getByTestId('mock-patient-stats-popup')).toBeInTheDocument();
    expect(screen.getByText(/Patient Stats Popup for ID: 1/i)).toBeInTheDocument();

    // Close popup
    const closeBtn = screen.getByRole('button', { name: 'ปิดหน้าต่าง' });
    fireEvent.click(closeBtn);

    expect(screen.queryByTestId('mock-patient-stats-popup')).not.toBeInTheDocument();
  });

  it('ควรกรองรายชื่อผู้ป่วยตามคำค้นหาได้ถูกต้อง', async () => {
    const mockData = [
      { id: '1', patientId: 'PT001', name: 'นายเอ กิจกรรม', testSets: [] },
      { id: '2', patientId: 'PT002', name: 'นางสาวบี สายใจ', testSets: [] },
    ];

    vi.mocked(global.fetch).mockReturnValueOnce(mockJsonResponse(mockData));

    render(<PatientStatsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('นายเอ กิจกรรม').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('นางสาวบี สายใจ').length).toBeGreaterThanOrEqual(1);
    });

    const searchInput = screen.getByPlaceholderText('ค้นหา');
    fireEvent.change(searchInput, { target: { value: 'สายใจ' } });

    await waitFor(() => {
      expect(screen.queryByText('นายเอ กิจกรรม')).not.toBeInTheDocument();
      expect(screen.getAllByText('นางสาวบี สายใจ').length).toBeGreaterThanOrEqual(1);
    });
  });
});
