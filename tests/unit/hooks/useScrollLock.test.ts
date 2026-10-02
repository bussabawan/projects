// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScrollLock } from '@/app/hooks/useScrollLock';

describe('useScrollLock (Unit Tests)', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.style.overscrollBehavior = '';
    document.documentElement.style.overscrollBehavior = '';
  });

  it('ควรตั้งค่า overflow และ overscrollBehavior เป็น hidden/none เมื่อ isLocked = true', () => {
    const { unmount } = renderHook(() => useScrollLock(true));

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.body.style.overscrollBehavior).toBe('none');
    expect(document.documentElement.style.overscrollBehavior).toBe('none');

    unmount();

    expect(document.body.style.overflow).toBe('');
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.style.overscrollBehavior).toBe('');
    expect(document.documentElement.style.overscrollBehavior).toBe('');
  });

  it('ไม่ควรเปลี่ยน style เมื่อ isLocked = false', () => {
    const { unmount } = renderHook(() => useScrollLock(false));

    expect(document.body.style.overflow).toBe('');
    expect(document.documentElement.style.overflow).toBe('');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('ควรรองรับการเปิด Modal ซ้อนกันหลายชั้น (Counter Lock) และปลดล็อกเมื่ออันสุดท้ายปิด', () => {
    // Modal 1 เปิด
    const modal1 = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe('hidden');

    // Modal 2 เปิดซ้อน
    const modal2 = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe('hidden');

    // ปิด Modal 1 (Modal 2 ยังเปิดอยู่ จึงยังต้อง hidden อยู่)
    modal1.unmount();
    expect(document.body.style.overflow).toBe('hidden');

    // ปิด Modal 2 (ปิดครบหมดแล้ว ต้องคืนค่า style เดิม)
    modal2.unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
