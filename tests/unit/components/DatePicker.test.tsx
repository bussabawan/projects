// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DatePicker from '@/app/components/DatePicker/DatePicker';

describe('DatePicker (Component Tests)', () => {
  it('ไม่ควร render สิ่งใดเมื่อ isOpen = false', () => {
    const { container } = render(
      <DatePicker 
        isOpen={false} 
        onClose={vi.fn()} 
        onSelect={vi.fn()} 
        initialDate="" 
        title="เลือกวันที่เริ่มต้น" 
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('ควร render title, วันที่, และปุ่ม ล้าง/วันนี้/ปิด เมื่อ isOpen = true', () => {
    render(
      <DatePicker 
        isOpen={true} 
        onClose={vi.fn()} 
        onSelect={vi.fn()} 
        initialDate="2026-03-15" 
        title="เลือกวันที่เริ่มต้น" 
      />
    );

    expect(screen.getByText('เลือกวันที่เริ่มต้น')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ล้าง' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'วันนี้' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ปิด' })).toBeInTheDocument();
  });

  it('ควรเรียก onSelect("") และ onClose เมื่อคลิกปุ่มล้าง', () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <DatePicker 
        isOpen={true} 
        onClose={handleClose} 
        onSelect={handleSelect} 
        initialDate="2026-03-15" 
        title="เลือกวันที่" 
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'ล้าง' }));

    expect(handleSelect).toHaveBeenCalledWith('');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('ควรเรียก onSelect(วันนี้) และ onClose เมื่อคลิกปุ่มวันนี้', () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <DatePicker 
        isOpen={true} 
        onClose={handleClose} 
        onSelect={handleSelect} 
        initialDate="" 
        title="เลือกวันที่" 
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'วันนี้' }));

    expect(handleSelect).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('ควรเรียก onClose เมื่อคลิกปุ่มปิด', () => {
    const handleClose = vi.fn();

    render(
      <DatePicker 
        isOpen={true} 
        onClose={handleClose} 
        onSelect={vi.fn()} 
        initialDate="" 
        title="เลือกวันที่" 
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'ปิด' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
