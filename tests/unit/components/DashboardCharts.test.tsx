// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardCharts from '@/app/admin/DashboardCharts';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  Pie: () => <div data-testid="pie" />,
  Bar: () => <div data-testid="bar" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('DashboardCharts (Component Tests)', () => {
  const mockUsageStats = [
    { date: '2026-10-01', users: 15, matching: 10, memory: 5 },
    { date: '2026-10-02', users: 20, matching: 12, memory: 8 },
  ];

  const mockImageStats = [
    { name: 'สัตว์', value: 25 },
    { name: 'ผลไม้', value: 15 },
  ];

  const mockExerciseStats = [
    { name: 'สัตว์', value: 5 },
    { name: 'ผลไม้', value: 3 },
  ];

  it('ควรเรนเดอร์กราฟทั้ง 3 ส่วน (LineChart, PieChart, BarChart) พร้อมชื่อหัวข้อ', () => {
    render(
      <DashboardCharts
        usageStats={mockUsageStats}
        imageCategoryStats={mockImageStats}
        exerciseCategoryStats={mockExerciseStats}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();

    expect(screen.getByText(/สถิติการเข้าใช้งานระบบ/i)).toBeInTheDocument();
    expect(screen.getByText(/สัดส่วนรูปภาพในแต่ละหมวดหมู่/i)).toBeInTheDocument();
    expect(screen.getByText(/จำนวนชุดแบบฝึกหัดในแต่ละหมวดหมู่/i)).toBeInTheDocument();
  });

  it('ควรเรนเดอร์ได้อย่างถูกต้องเมื่อข้อมูลเป็น Array ว่าง', () => {
    render(
      <DashboardCharts
        usageStats={[]}
        imageCategoryStats={[]}
        exerciseCategoryStats={[]}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });
});
