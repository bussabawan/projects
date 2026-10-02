/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MemorySettingsPage from '@/app/user/games/memory/[id]/page';
import { getExerciseImageCount, getGameData } from '@/app/actions/matchingActions';
import { getExerciseMaxAudioTime } from '@/app/actions/memoryActions';

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams('mode=image');

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: '5' }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/app/actions/matchingActions', () => ({
  getExerciseImageCount: vi.fn(),
  getGameData: vi.fn(),
}));

vi.mock('@/app/actions/memoryActions', () => ({
  getExerciseMaxAudioTime: vi.fn(),
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

describe('MemorySettingsPage (Client Component Page)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams('mode=image');
    vi.mocked(getExerciseImageCount).mockResolvedValue(20);
    vi.mocked(getGameData).mockResolvedValue({ success: true, data: [] });
    vi.mocked(getExerciseMaxAudioTime).mockResolvedValue(3);
  });

  it('ควรเรนเดอร์หน้าตั้งค่าเกมความจำโหมดภาพ และแสดงตัวเลือกตั้งค่าครบถ้วน', async () => {
    render(<MemorySettingsPage />);

    expect(screen.getByText('จำภาพเหมือน')).toBeInTheDocument();
    expect(screen.getByText('ตั้งค่าการฝึก')).toBeInTheDocument();
    expect(screen.getByText('จำนวนโจทย์ที่ต้องจำ')).toBeInTheDocument();
    expect(screen.getByText('เวลาที่แสดงคำถาม')).toBeInTheDocument();

    await waitFor(() => {
      expect(getExerciseImageCount).toHaveBeenCalledWith(5);
    });
  });

  it('ควรกดปุ่มเริ่มเกม และนำทางไปยังหน้ากระดานเล่นเกมความจำ', async () => {
    render(<MemorySettingsPage />);

    await waitFor(() => {
      expect(getExerciseImageCount).toHaveBeenCalled();
    });

    const startBtn = screen.getByRole('button', { name: /เริ่มเกม/i });
    fireEvent.click(startBtn);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/\/user\/games\/memory\/5\/play\?mode=image&q=\d+&a=\d+&t=\d+&tc=\d+/)
    );
  });

  it('ควรกดปุ่มย้อนกลับ และนำทางกลับไปยังหน้ารายการหมวดหมู่เกมความจำ', () => {
    render(<MemorySettingsPage />);

    const backBtn = screen.getByRole('button', { name: /ย้อนกลับ/i });
    fireEvent.click(backBtn);

    expect(mockPush).toHaveBeenCalledWith('/user/games/memory');
  });

  it('เมื่อ mode=word ควรแสดงหัวข้อ "จำคำแล้วเลือกภาพ"', () => {
    mockSearchParams = new URLSearchParams('mode=word');
    render(<MemorySettingsPage />);

    expect(screen.getByText('จำคำแล้วเลือกภาพ')).toBeInTheDocument();
  });
});
