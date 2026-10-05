/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MatchingGamePage from '@/app/user/games/matching/[id]/play/page';
import { getGameData, saveMatchingGameResult } from '@/app/actions/matchingActions';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: '10' }),
  useSearchParams: () => new URLSearchParams('type=image&q=2&a=2'),
}));

vi.mock('@/app/actions/matchingActions', () => ({
  getGameData: vi.fn(),
  saveMatchingGameResult: vi.fn(),
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

// Mock window.Image
class MockImageElement {
  private _src = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  get src() {
    return this._src;
  }
  set src(val: string) {
    this._src = val;
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
}
window.Image = MockImageElement as unknown as typeof Image;

// Mock window.Audio
class MockAudioElement {
  preload = 'auto';
  oncanplaythrough: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private _src = '';
  get src() {
    return this._src;
  }
  set src(val: string) {
    this._src = val;
    setTimeout(() => {
      if (this.oncanplaythrough) this.oncanplaythrough();
    }, 0);
  }
  play = vi.fn().mockImplementation(() => {
    setTimeout(() => {
      if (this.onended) this.onended();
    }, 0);
    return Promise.resolve();
  });
  pause = vi.fn();
}
window.Audio = MockAudioElement as unknown as typeof Audio;

describe('MatchingPlayPage (Client Component Page)', () => {
  const mockQuestions = [
    {
      target: { id: 1, title: 'แมว', imageUrl: 'cat.jpg', audioUrl: 'cat.mp3' },
      choices: [
        { id: 1, title: 'แมว', imageUrl: 'cat.jpg' },
        { id: 2, title: 'สุนัข', imageUrl: 'dog.jpg' },
      ],
    },
    {
      target: { id: 3, title: 'นก', imageUrl: 'bird.jpg' },
      choices: [
        { id: 3, title: 'นก', imageUrl: 'bird.jpg' },
        { id: 4, title: 'ปลา', imageUrl: 'fish.jpg' },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getGameData).mockResolvedValue({
      success: true,
      data: mockQuestions,
    });
    vi.mocked(saveMatchingGameResult).mockResolvedValue({ success: true } as unknown as void);
  });

  it('ควรเรนเดอร์คำถามและตัวเลือกของการแข่งขัน', async () => {
    render(<MatchingGamePage />);

    // Wait until game finishes loading and renders question
    await waitFor(() => {
      expect(screen.getByText(/ข้อ\s*1\s*จาก\s*2/i)).toBeInTheDocument();
    });

    // Verify target and choices
    expect(screen.getByAltText('Target')).toBeInTheDocument();
    expect(screen.getByAltText('Choice 1')).toBeInTheDocument();
    expect(screen.getByAltText('Choice 2')).toBeInTheDocument();
  });

  it('เมื่อตอบคำถามถูกครบทุกข้อ ควรเรียก saveMatchingGameResult และนำทางไปยังหน้าสรุป', async () => {
    render(<MatchingGamePage />);

    await waitFor(() => {
      expect(screen.getByText(/ข้อ\s*1\s*จาก\s*2/i)).toBeInTheDocument();
    });

    // Question 1: Target is ID 1 (Choice 1)
    const choice1 = screen.getByAltText('Choice 1');
    fireEvent.click(choice1);

    // Question 2: Should advance to question 2 (ข้อ 2 จาก 2)
    await waitFor(() => {
      expect(screen.getByText(/ข้อ\s*2\s*จาก\s*2/i)).toBeInTheDocument();
    });

    // Question 2: Target is ID 3 (Choice 1 of question 2)
    const choice2 = screen.getByAltText('Choice 1');
    fireEvent.click(choice2);

    // Game finishes
    await waitFor(() => {
      expect(saveMatchingGameResult).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/user/games/summary?tq=2')
      );
    });
  });

  it('เมื่อคลิกปุ่มจบเกม ควรเปิด Modal ยืนยันการจบเกม', async () => {
    render(<MatchingGamePage />);

    await waitFor(() => {
      expect(screen.getByText(/ข้อ\s*1\s*จาก\s*2/i)).toBeInTheDocument();
    });

    const exitBtn = screen.getByRole('button', { name: /จบเกม/i });
    fireEvent.click(exitBtn);

    expect(screen.getByText(/ต้องการออกจากเกมหรือไม่/i)).toBeInTheDocument();
  });
});
