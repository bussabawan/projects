/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GameTypesPage from '@/app/user/games/page';

describe('UserGamesMenuPage (Server Component Page)', () => {
  it('ควรเรนเดอร์ประเภทเกมทั้งหมด (จับคู่, ความจำ, ร่างกาย) และลิงก์ที่ถูกต้อง', () => {
    render(<GameTypesPage />);

    expect(screen.getByText('ประเภทเกม')).toBeInTheDocument();

    // Matching Game Card
    const matchingLink = screen.getByText('จับคู่').closest('a');
    expect(matchingLink).toBeInTheDocument();
    expect(matchingLink).toHaveAttribute('href', '/user/games/matching');

    // Memory Game Card
    const memoryLink = screen.getByText('ความจำ').closest('a');
    expect(memoryLink).toBeInTheDocument();
    expect(memoryLink).toHaveAttribute('href', '/user/games/memory');

    // Body Game Card (Disabled / Coming Soon)
    expect(screen.getByText('ร่างกาย')).toBeInTheDocument();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });
});
