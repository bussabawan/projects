/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminPage from '@/app/admin/page';
import { AdminStatsModel } from '@/lib/models/adminStats';

// Mock dependencies
vi.mock('@/lib/models/adminStats', () => ({
  AdminStatsModel: {
    getOverviewStats: vi.fn(),
    getSystemUsageStats: vi.fn(),
    getImageCategoryStats: vi.fn(),
    getExerciseCategoryStats: vi.fn(),
  },
}));

vi.mock('@/app/admin/DashboardCharts', () => ({
  default: function MockDashboardCharts(props: { usageStats?: unknown[] }) {
    return (
      <div data-testid="mock-dashboard-charts">
        <span>Mock Dashboard Charts</span>
        <span data-testid="usage-stats-count">{props.usageStats?.length || 0}</span>
      </div>
    );
  },
}));

describe('AdminOverviewPage (Server Component Page)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ควรดึงข้อมูลสถิติและเรนเดอร์การ์ดสถิติภาพรวมทั้ง 4 ใบได้อย่างถูกต้อง', async () => {
    vi.mocked(AdminStatsModel.getOverviewStats).mockResolvedValue({
      totalPatients: 120,
      totalCategories: 15,
      totalPhotos: 450,
      totalExercises: 25,
    });
    vi.mocked(AdminStatsModel.getSystemUsageStats).mockResolvedValue([
      { date: '2026-03-01', count: 10 },
      { date: '2026-03-02', count: 15 },
    ]);
    vi.mocked(AdminStatsModel.getImageCategoryStats).mockResolvedValue([
      { name: 'สัตว์', value: 50 },
    ]);
    vi.mocked(AdminStatsModel.getExerciseCategoryStats).mockResolvedValue([
      { name: 'หมวดง่าย', value: 30 },
    ]);

    // AdminPage is an async Server Component
    const pageJsx = await AdminPage();
    render(pageJsx);

    expect(screen.getByText('ภาพรวมสถิติ')).toBeInTheDocument();

    // Check 4 stat cards
    expect(screen.getByText('ผู้ป่วยทั้งหมด')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();

    expect(screen.getByText('หมวดหมู่ทั้งหมด')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    expect(screen.getByText('รูปภาพทั้งหมด')).toBeInTheDocument();
    expect(screen.getByText('450')).toBeInTheDocument();

    expect(screen.getByText('ชุดแบบฝึกหัดทั้งหมด')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();

    // Check DashboardCharts rendering
    expect(screen.getByTestId('mock-dashboard-charts')).toBeInTheDocument();
    expect(screen.getByTestId('usage-stats-count')).toHaveTextContent('2');
  });

  it('ควรจัดการกรณีค่าสถิติเริ่มต้นเป็น 0 ได้ถูกต้อง', async () => {
    vi.mocked(AdminStatsModel.getOverviewStats).mockResolvedValue({
      totalPatients: 0,
      totalCategories: 0,
      totalPhotos: 0,
      totalExercises: 0,
    });
    vi.mocked(AdminStatsModel.getSystemUsageStats).mockResolvedValue([]);
    vi.mocked(AdminStatsModel.getImageCategoryStats).mockResolvedValue([]);
    vi.mocked(AdminStatsModel.getExerciseCategoryStats).mockResolvedValue([]);

    const pageJsx = await AdminPage();
    render(pageJsx);

    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBeGreaterThanOrEqual(4);
  });
});
