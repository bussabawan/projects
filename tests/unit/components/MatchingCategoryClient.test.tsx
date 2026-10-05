// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MatchingCategoryClient from '@/app/user/games/matching/MatchingCategoryClient';

describe('MatchingCategoryClient (Component Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          { exercises_id: 1, exercises_name: 'แบบฝึกหัดสัตว์' },
          { exercises_id: 2, exercises_name: 'แบบฝึกหัดยานพาหนะ' },
        ],
      }),
    });
  });

  it('ควรโหลดและแสดงรายการแบบฝึกหัดสำหรับเกมจับคู่', async () => {
    render(<MatchingCategoryClient />);

    expect(screen.getByText('กำลังโหลดหมวดหมู่แบบฝึกหัด...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('แบบฝึกหัดสัตว์')).toBeInTheDocument();
      expect(screen.getByText('แบบฝึกหัดยานพาหนะ')).toBeInTheDocument();
    });
  });

  it('เมื่อสลับแท็บเป็น "คำกับภาพ" ควรเปลี่ยนหมวดหมู่และลิงก์ของแบบฝึกหัดเป็น type=word', async () => {
    render(<MatchingCategoryClient />);

    await waitFor(() => {
      expect(screen.getByText('แบบฝึกหัดสัตว์')).toBeInTheDocument();
    });

    const wordTab = screen.getByText('คำกับภาพ');
    fireEvent.click(wordTab);

    const link = screen.getByText('แบบฝึกหัดสัตว์').closest('a');
    expect(link).toHaveAttribute('href', expect.stringContaining('type=word'));
  });

  it('เมื่อพิมพ์ค้นหา ควรกรองรายการแบบฝึกหัดตามคำค้นหา', async () => {
    render(<MatchingCategoryClient />);

    await waitFor(() => {
      expect(screen.getByText('แบบฝึกหัดสัตว์')).toBeInTheDocument();
      expect(screen.getByText('แบบฝึกหัดยานพาหนะ')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('ค้นหา');
    fireEvent.change(searchInput, { target: { value: 'สัตว์' } });

    await waitFor(() => {
      expect(screen.getByText('แบบฝึกหัดสัตว์')).toBeInTheDocument();
      expect(screen.queryByText('แบบฝึกหัดยานพาหนะ')).not.toBeInTheDocument();
    });
  });
});
