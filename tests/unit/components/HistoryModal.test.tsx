// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HistoryModal from '@/app/components/HistoryModal/HistoryModal';

describe('HistoryModal (Component Tests)', () => {
  const mockData = {
    id: 1,
    dateStr: '2026-03-01',
    plays: 'เล่น 2 ครั้ง',
    totalTime: 'ใช้เวลา 00:05:00',
    details: [
      { id: 101, time: '10:00 น.', icon: 'puzzle', game: 'จับคู่', score: '90 คะแนน', duration: '02:30 นาที' },
      { id: 102, time: '10:15 น.', icon: 'brain', game: 'ความจำ', score: '45 คะแนน', duration: '02:30 นาที' }
    ]
  };

  it('ไม่ควรแสดงผลเมื่อ data = null หรือ isOpen = false', () => {
    const { container } = render(<HistoryModal isOpen={true} onClose={vi.fn()} data={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('ควรแสดงผลวันที่ สถิติ และรายการเกมที่เล่น', () => {
    render(<HistoryModal isOpen={true} onClose={vi.fn()} data={mockData} />);

    expect(screen.getByText('2026-03-01')).toBeInTheDocument();
    expect(screen.getByText('🎮 เล่น 2 ครั้ง')).toBeInTheDocument();
    expect(screen.getByText('⏱️ ใช้เวลา 00:05:00')).toBeInTheDocument();
    expect(screen.getAllByText('จับคู่').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ความจำ').length).toBeGreaterThan(0);
    expect(screen.getByText('90')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('ควรสามารถกดกรองประเภทเกมได้ (Filter Pills)', () => {
    render(<HistoryModal isOpen={true} onClose={vi.fn()} data={mockData} />);

    // คลิกกรองเฉพาะเกมจับคู่
    const matchFilter = screen.getByText('จับคู่', { selector: 'span' });
    fireEvent.click(matchFilter);

    expect(screen.getByText('90')).toBeInTheDocument();
  });
});
