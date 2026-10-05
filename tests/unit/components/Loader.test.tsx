// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loader from '@/app/components/Loader/Loader';

describe('Loader (Component Tests)', () => {
  it('ควรแสดงผล loader text เมื่อระบุ text prop', () => {
    render(<Loader text="กำลังโหลดข้อมูล..." />);
    expect(screen.getByText('กำลังโหลดข้อมูล...')).toBeInTheDocument();
  });

  it('ควร render แบบ inline เมื่อ inline = true', () => {
    const { container } = render(<Loader inline={true} />);
    expect(container.querySelector('span')).toBeInTheDocument();
  });

  it('ควร render แบบ fullScreen เมื่อ fullScreen = true', () => {
    const { container } = render(<Loader fullScreen={true} text="กำลังโหลดหน้าจอเต็ม" />);
    expect(screen.getByText('กำลังโหลดหน้าจอเต็ม')).toBeInTheDocument();
    expect(container.firstChild).toBeInTheDocument();
  });
});
