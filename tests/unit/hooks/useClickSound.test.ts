// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClickSound } from '@/app/hooks/useClickSound';

describe('useClickSound (Unit Tests)', () => {
  let playMock: ReturnType<typeof vi.fn>;
  let cloneNodeMock: ReturnType<typeof vi.fn>;
  let audioConstructorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    playMock = vi.fn().mockResolvedValue(undefined);
    cloneNodeMock = vi.fn().mockReturnValue({
      play: playMock
    });
    audioConstructorSpy = vi.fn();

    class MockAudio {
      constructor(url: string) {
        audioConstructorSpy(url);
      }
      cloneNode = cloneNodeMock;
    }

    vi.stubGlobal('Audio', MockAudio);
  });

  it('ควรสร้าง Audio instance และเล่นเสียงเมื่อเรียก playClick', () => {
    const { result } = renderHook(() => useClickSound());

    expect(audioConstructorSpy).toHaveBeenCalledWith('/audio/mouse-click-352734.mp3');

    act(() => {
      result.current();
    });

    expect(cloneNodeMock).toHaveBeenCalledWith(true);
    expect(playMock).toHaveBeenCalled();
  });

  it('ไม่ควร throw Error เมื่อ play() ล้มเหลว (เช่น browser autoplay policy)', () => {
    playMock.mockRejectedValueOnce(new Error('Autoplay prevented'));

    const { result } = renderHook(() => useClickSound());

    expect(() => {
      act(() => {
        result.current();
      });
    }).not.toThrow();
  });
});
