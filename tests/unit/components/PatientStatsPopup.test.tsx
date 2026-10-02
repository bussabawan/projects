// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PatientStatsPopup from '@/app/admin/patient-stats/components/PatientStatsPopup';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('PatientStatsPopup (Component Tests)', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        availableExerciseSets: ['ชุดที่ 1', 'ชุดที่ 2'],
        availableCategories: ['สัตว์', 'ผลไม้'],
        scoreStats: {
          total: { correct: 20, incorrect: 5 },
          separated: {
            matching: { correct: 12, incorrect: 3 },
            memory: { correct: 8, incorrect: 2 },
          },
        },
        dailyStats: [
          {
            dateStr: '2026-10-01',
            logins: 2,
            memoryPlays: 3,
            matchingPlays: 5,
            correct: 20,
            incorrect: 5,
          },
        ],
      }),
    });
  });

  it('เมื่อ isOpen เป็น false ไม่ควรแสดงรายละเอียดสถิติในหน้าจอ', () => {
    render(
      <PatientStatsPopup
        isOpen={false}
        onClose={mockOnClose}
        patientId="10"
      />
    );

    expect(screen.queryByText('รายละเอียดสถิติ')).not.toBeInTheDocument();
  });

  it('เมื่อ isOpen เป็น true ควรโหลดและแสดงสถิติของผู้ป่วยพร้อมป้ายสรุป', async () => {
    render(
      <PatientStatsPopup
        isOpen={true}
        onClose={mockOnClose}
        patientId="10"
      />
    );

    expect(screen.getByText('รายละเอียดสถิติ')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/จำนวน Login:/i)).toBeInTheDocument();
      expect(screen.getByText(/ความจำ:/i)).toBeInTheDocument();
      expect(screen.getByText(/จับคู่:/i)).toBeInTheDocument();
    });
  });

  it('เมื่อกดปุ่มปิด (Close popup) ควรเรียก onClose', () => {
    render(
      <PatientStatsPopup
        isOpen={true}
        onClose={mockOnClose}
        patientId="10"
      />
    );

    const closeBtn = screen.getByRole('button', { name: /close popup/i });
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
