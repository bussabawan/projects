// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MemoryCategoryClient from '@/app/user/games/memory/MemoryCategoryClient';

describe('MemoryCategoryClient (Component Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          { exercises_id: 1, exercises_name: 'ความจำรูปสัตว์' },
          { exercises_id: 2, exercises_name: 'ความจำรูปของใช้' },
        ],
      }),
    });
  });

  it('ควรโหลดและแสดงรายการแบบฝึกหัดสำหรับเกมความจำ', async () => {
    render(<MemoryCategoryClient />);

    expect(screen.getByText('กำลังโหลดหมวดหมู่แบบฝึกหัด...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('ความจำรูปสัตว์')).toBeInTheDocument();
      expect(screen.getByText('ความจำรูปของใช้')).toBeInTheDocument();
    });
  });

  it('เมื่อสลับแท็บเป็น "คำกับภาพ" ควรเปลี่ยนลิงก์ของแบบฝึกหัดเป็น mode=word', async () => {
    render(<MemoryCategoryClient />);

    await waitFor(() => {
      expect(screen.getByText('ความจำรูปสัตว์')).toBeInTheDocument();
    });

    const wordTab = screen.getByText('คำกับภาพ');
    fireEvent.click(wordTab);

    const link = screen.getByText('ความจำรูปสัตว์').closest('a');
    expect(link).toHaveAttribute('href', expect.stringContaining('mode=word'));
  });

  it('เมื่อพิมพ์ค้นหา ควรกรองรายการแบบฝึกหัดตามคำค้นหา', async () => {
    render(<MemoryCategoryClient />);

    await waitFor(() => {
      expect(screen.getByText('ความจำรูปสัตว์')).toBeInTheDocument();
      expect(screen.getByText('ความจำรูปของใช้')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('ค้นหา');
    fireEvent.change(searchInput, { target: { value: 'สัตว์' } });

    await waitFor(() => {
      expect(screen.getByText('ความจำรูปสัตว์')).toBeInTheDocument();
      expect(screen.queryByText('ความจำรูปของใช้')).not.toBeInTheDocument();
    });
  });
});
