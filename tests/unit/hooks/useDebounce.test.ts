// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/app/hooks/useDebounce';

describe('useDebounce (Unit Tests)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ควรคืนค่าเริ่มต้นทันทีเมื่อ hook mount', () => {
    const { result } = renderHook(() => useDebounce('เริ่มต้น', 500));
    expect(result.current).toBe('เริ่มต้น');
  });

  it('ไม่ควรอัปเดตค่าก่อนถึงเวลา delay ที่กำหนด', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'คำค้นหาที่ 1', delay: 500 } }
    );

    rerender({ value: 'คำค้นหาที่ 2', delay: 500 });

    // ข้ามเวลาไปเพียง 300ms (ยังไม่ถึง 500ms)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('คำค้นหาที่ 1');
  });

  it('ควรอัปเดตค่าเมื่อเวลาผ่านไปครบกำหนด delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'คำค้นหาที่ 1', delay: 500 } }
    );

    rerender({ value: 'คำค้นหาที่ 2', delay: 500 });

    // ข้ามเวลาไปครบ 500ms
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('คำค้นหาที่ 2');
  });

  it('ควรล้าง timer เก่าเมื่อมีการเปลี่ยนค่าใหม่อย่างรวดเร็ว', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'ก', delay: 500 } }
    );

    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: 'กา', delay: 500 });

    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: 'การ', delay: 500 });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('การ');
  });
});
