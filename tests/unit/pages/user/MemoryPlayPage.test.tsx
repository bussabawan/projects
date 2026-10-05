/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MemoryGamePlayPage from '@/app/user/games/memory/[id]/play/page';
import { getMemoryGameData, saveMemoryGameResult } from '@/app/actions/memoryActions';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: '12' }),
  useSearchParams: () => new URLSearchParams('mode=picture&q=1&a=2&t=2&tc=1'),
}));

vi.mock('@/app/actions/memoryActions', () => ({
  getMemoryGameData: vi.fn(),
  saveMemoryGameResult: vi.fn(),
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

describe('MemoryPlayPage (Client Component Page)', () => {
  const mockGameData = [
    {
      targets: [{ id: 101, title: 'ช้าง', imageUrl: 'elephant.jpg', audioUrl: 'elephant.mp3' }],
      choices: [
        { id: 101, title: 'ช้าง', imageUrl: 'elephant.jpg' },
        { id: 102, title: 'ม้า', imageUrl: 'horse.jpg' },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMemoryGameData).mockResolvedValue({
      success: true,
      data: mockGameData,
    });
    vi.mocked(saveMemoryGameResult).mockResolvedValue({ success: true } as unknown as void);
  });

  it('ควรเรนเดอร์หน้าจำภาพ (Question Phase) พร้อมเวลานับถอยหลัง', async () => {
    render(<MemoryGamePlayPage />);

    // Wait until question loads
    await waitFor(() => {
      expect(screen.getByText(/ข้อ\s*1\s*จาก\s*1/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/กำลังจะหายใน/i)).toBeInTheDocument();
    expect(screen.getByAltText('Target 0')).toBeInTheDocument();
  });

  it('เมื่อคลิกปุ่มจบเกม ควรเปิด Modal ยืนยันการออกจากเกม', async () => {
    render(<MemoryGamePlayPage />);

    await waitFor(() => {
      expect(screen.getByText(/ข้อ\s*1\s*จาก\s*1/i)).toBeInTheDocument();
    });

    const exitBtn = screen.getByRole('button', { name: /จบเกม/i });
    fireEvent.click(exitBtn);

    expect(screen.getByText(/ต้องการออกจากเกมหรือไม่/i)).toBeInTheDocument();
  });
});
