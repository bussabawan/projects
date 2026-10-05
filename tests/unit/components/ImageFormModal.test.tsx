// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageFormModal from '@/app/admin/images/components/ImageFormModal';

describe('ImageFormModal (Component Tests)', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['fake-audio'], { type: 'audio/mpeg' }),
      json: async () => ({ ok: true, url: '/uploads/new-file.png' }),
    });

    class MockAudio {
      duration = 1.5;
      onloadedmetadata: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor() {
        setTimeout(() => {
          if (this.onloadedmetadata) this.onloadedmetadata();
        }, 0);
      }
    }
    window.Audio = MockAudio as unknown as typeof Audio;
  });

  it('ควรเรนเดอร์ฟอร์มและตรวจสอบ validation เมื่อไม่เลือกรูปภาพ', async () => {
    render(
      <ImageFormModal
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('เพิ่มข้อมูลรูปภาพ')).toBeInTheDocument();

    const saveBtn = screen.getByText('บันทึก');
    fireEvent.click(saveBtn);

    expect(screen.getByText('กรุณาเลือกรูปภาพก่อนบันทึก')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('ควรตรวจสอบ validation เมื่อเลือกสร้างเสียงอัตโนมัติ (TTS) แต่ไม่กรอกข้อความเสียง', async () => {
    const existingImage = {
      id: 1,
      title: 'รูปแมว',
      imageUrl: '/uploads/cat.png',
      audioGen: 1,
      audioTitle: '',
    };

    render(
      <ImageFormModal
        image={existingImage}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const saveBtn = screen.getByText('บันทึก');
    fireEvent.click(saveBtn);

    expect(screen.getByText('กรุณากรอกข้อความเสียงก่อนบันทึก')).toBeInTheDocument();
  });

  it('เมื่อแก้ไขรูปภาพและกดบันทึก ควรเรียก onSave ด้วยข้อมูลที่ถูกต้อง', async () => {
    const existingImage = {
      id: 1,
      title: 'รูปสุนัข',
      imageUrl: '/uploads/dog.png',
      audioGen: 1,
      audioTitle: 'สุนัข',
      audioUrl: '/uploads/dog.mp3',
      audioTime: 1.5,
    };

    render(
      <ImageFormModal
        image={existingImage}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const saveBtn = screen.getByText('บันทึก');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          imageName: 'รูปสุนัข',
          speechText: 'สุนัข',
          useAutoSpeech: true,
          imageUrl: '/uploads/dog.png',
        })
      );
    });
  });

  it('เมื่อกดปุ่มยกเลิก ควรเรียก onClose', () => {
    render(
      <ImageFormModal
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const cancelBtn = screen.getByText('ยกเลิก');
    fireEvent.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
