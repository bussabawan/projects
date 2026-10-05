/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MatchingSettingsPage from '@/app/user/games/matching/[id]/page';
import { getExerciseImageCount, getGameData } from '@/app/actions/matchingActions';

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams('type=image');

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: '5' }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/app/actions/matchingActions', () => ({
  getExerciseImageCount: vi.fn(),
  getGameData: vi.fn(),
}));

vi.mock('@/app/hooks/useClickSound', () => ({
  useClickSound: () => vi.fn(),
}));

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: function MockImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || 'mock-image'} />;
  },
}));

describe('MatchingSettingsPage (Client Component Page)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams('type=image');
    vi.mocked(getExerciseImageCount).mockResolvedValue(15);
    vi.mocked(getGameData).mockResolvedValue({ success: true, questions: [] });
  });

  it('ควรเรนเดอร์หน้าตั้งค่าเกมจับคู่ภาพกับภาพ และแสดงค่าเริ่มต้น', async () => {
    render(<MatchingSettingsPage />);

    expect(screen.getByText('จับคู่ภาพกับภาพ')).toBeInTheDocument();
    expect(screen.getByText('ตั้งค่าการฝึก')).toBeInTheDocument();
    expect(screen.getByText('จำนวนคำถาม')).toBeInTheDocument();
    expect(screen.getByText('จำนวนคำตอบ')).toBeInTheDocument();

    await waitFor(() => {
      expect(getExerciseImageCount).toHaveBeenCalledWith(5);
    });
  });

  it('ควรกดปุ่มเริ่มเกม และนำทางไปยังหน้ากระดานเล่นเกมพร้อม Query Parameters', async () => {
    render(<MatchingSettingsPage />);

    await waitFor(() => {
      expect(getExerciseImageCount).toHaveBeenCalled();
    });

    const startBtn = screen.getByRole('button', { name: /เริ่มเกม/i });
    fireEvent.click(startBtn);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/\/user\/games\/matching\/5\/play\?type=image&q=\d+&a=\d+/)
    );
  });

  it('ควรกดปุ่มย้อนกลับ และนำทางกลับไปยังหน้ารายการหมวดหมู่เกมจับคู่', async () => {
    render(<MatchingSettingsPage />);

    const backBtn = screen.getByRole('button', { name: /ย้อนกลับ/i });
    fireEvent.click(backBtn);

    expect(mockPush).toHaveBeenCalledWith('/user/games/matching?type=image');
  });

  it('เมื่อ type=word ควรแสดงหัวข้อจับคู่คำกับภาพ', () => {
    mockSearchParams = new URLSearchParams('type=word');
    render(<MatchingSettingsPage />);

    expect(screen.getByText('จับคู่คำกับภาพ')).toBeInTheDocument();
  });
});
