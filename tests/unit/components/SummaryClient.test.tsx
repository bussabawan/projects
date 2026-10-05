// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SummaryClient from '@/app/user/games/summary/SummaryClient';

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams({
  tq: '10',
  c: '10',
  co: '10',
  time: '25',
  returnUrl: '/user/games/matching/1',
  gameType: 'matching',
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('next/dynamic', () => ({
  default: () => {
    return function MockChart() {
      return <div data-testid="mock-summary-chart">Mock Chart</div>;
    };
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button {...props}>{children}</button>
    ),
  },
}));

describe('SummaryClient (Component Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockHistoryData = [
    { name: 'ครั้งที่ 1', date: '01/10/2026', score: 100 },
  ];

  it('ควรเรนเดอร์คะแนนเต็ม 100 และสถิติที่ถูกต้องสำหรับเกมจับคู่เมื่อตอบถูกหมด', async () => {
    mockSearchParams = new URLSearchParams({
      tq: '10',
      c: '10',
      co: '10',
      time: '25',
      returnUrl: '/user/games/matching/1',
      gameType: 'matching',
    });

    render(<SummaryClient historyData={mockHistoryData} />);

    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });

    // Score display & label
    const scoreElements = screen.getAllByText('100');
    expect(scoreElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('คะแนน')).toBeInTheDocument();

    // Stats items
    expect(screen.getByText('ความแม่นยำ')).toBeInTheDocument();
    expect(screen.getByText('ระยะเวลาที่ใช้')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();

    expect(screen.getByTestId('mock-summary-chart')).toBeInTheDocument();
  });

  it('เมื่อกดปุ่ม "ย้อนกลับ" ควรนำทางไปยัง returnUrl ที่ระบุใน Query Params', async () => {
    mockSearchParams = new URLSearchParams({
      tq: '5',
      c: '5',
      co: '5',
      time: '15',
      returnUrl: '/user/games/memory/2',
      gameType: 'memory',
    });

    render(<SummaryClient historyData={mockHistoryData} />);

    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });

    const backButtons = screen.getAllByRole('button', { name: /ย้อนกลับ/i });
    expect(backButtons.length).toBeGreaterThan(0);
    fireEvent.click(backButtons[0]);

    expect(mockPush).toHaveBeenCalledWith('/user/games/memory/2');
  });

  it('ควรคำนวณคะแนนของเกมความจำ (memory) ตามสัดส่วนความแม่นยำ (accuracy)', async () => {
    // 8 correct out of 10 clicks = 80% accuracy -> score = 80
    mockSearchParams = new URLSearchParams({
      tq: '8',
      c: '10',
      co: '8',
      time: '40',
      returnUrl: '/user/games',
      gameType: 'memory',
    });

    render(<SummaryClient historyData={mockHistoryData} />);

    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });

    // Both score circle and accuracy stat have 80
    const elements80 = screen.getAllByText('80');
    expect(elements80.length).toBe(2);
    expect(screen.getByText('ความแม่นยำ')).toBeInTheDocument();
  });
});
