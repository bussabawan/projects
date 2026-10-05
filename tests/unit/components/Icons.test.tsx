// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PuzzleIcon, BrainIcon, PersonIcon } from '@/app/components/Icons';

describe('Icons (src/app/components/Icons.tsx)', () => {
  it('renders PuzzleIcon with default size and custom props', () => {
    const { container, rerender } = render(<PuzzleIcon data-testid="puzzle-icon" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');

    rerender(<PuzzleIcon size={48} className="custom-puzzle" />);
    const updatedSvg = container.querySelector('svg');
    expect(updatedSvg).toHaveAttribute('width', '48');
    expect(updatedSvg).toHaveAttribute('height', '48');
    expect(updatedSvg).toHaveClass('custom-puzzle');
  });

  it('renders BrainIcon with default size and custom props', () => {
    const { container, rerender } = render(<BrainIcon data-testid="brain-icon" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');

    rerender(<BrainIcon size={32} />);
    const updatedSvg = container.querySelector('svg');
    expect(updatedSvg).toHaveAttribute('width', '32');
    expect(updatedSvg).toHaveAttribute('height', '32');
  });

  it('renders PersonIcon with default size and custom props', () => {
    const { container, rerender } = render(<PersonIcon data-testid="person-icon" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');

    rerender(<PersonIcon size="40" />);
    const updatedSvg = container.querySelector('svg');
    expect(updatedSvg).toHaveAttribute('width', '40');
    expect(updatedSvg).toHaveAttribute('height', '40');
  });
});
