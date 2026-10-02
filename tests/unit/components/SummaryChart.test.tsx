// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SummaryChart from '@/app/user/games/summary/SummaryChart';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

describe('SummaryChart (Component Tests)', () => {
  const mockData = [
    { name: 'ครั้งที่ 1', date: '01/10/2026', score: 80 },
    { name: 'ครั้งที่ 2', date: '02/10/2026', score: 95 },
  ];

  it('ควรเรนเดอร์ LineChart พร้อมแกนและเส้นข้อมูลของ Recharts', () => {
    render(<SummaryChart data={mockData} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('line')).toBeInTheDocument();
  });
});
