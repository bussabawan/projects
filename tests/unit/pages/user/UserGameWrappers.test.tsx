// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MatchingCategoryPage from '@/app/user/games/matching/page';
import MemoryCategoryPage from '@/app/user/games/memory/page';
import SummaryPage from '@/app/user/games/summary/page';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getUserMatchingGameHistory } from '@/app/actions/matchingActions';
import { getUserMemoryGameHistory } from '@/app/actions/memoryActions';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/app/actions/matchingActions', () => ({
  getUserMatchingGameHistory: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/app/actions/memoryActions', () => ({
  getUserMemoryGameHistory: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/app/user/games/matching/MatchingCategoryClient', () => ({
  default: () => <div data-testid="matching-category-client">Matching Category Client</div>,
}));

vi.mock('@/app/user/games/memory/MemoryCategoryClient', () => ({
  default: () => <div data-testid="memory-category-client">Memory Category Client</div>,
}));

vi.mock('@/app/user/games/summary/SummaryClient', () => ({
  default: ({ historyData }: { historyData: Array<{ name: string; date: string; score: number }> }) => (
    <div data-testid="summary-client" data-count={historyData.length}>
      Summary Client: {historyData.map((d) => `${d.name}:${d.score}`).join(',')}
    </div>
  ),
}));

describe('User Game Wrapper Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MatchingCategoryPage', () => {
    it('renders MatchingCategoryClient component', () => {
      render(<MatchingCategoryPage />);
      expect(screen.getByTestId('matching-category-client')).toBeInTheDocument();
    });
  });

  describe('MemoryCategoryPage', () => {
    it('renders MemoryCategoryClient component', () => {
      render(<MemoryCategoryPage />);
      expect(screen.getByTestId('memory-category-client')).toBeInTheDocument();
    });
  });

  describe('SummaryPage', () => {
    it('redirects to /login when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null);

      await expect(
        SummaryPage({
          searchParams: Promise.resolve({ gameType: 'matching' }),
        })
      ).rejects.toThrow('REDIRECT:/login');

      expect(redirect).toHaveBeenCalledWith('/login');
    });

    it('fetches matching history and renders SummaryClient with calculated score', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'patient-123', name: 'Patient Test' },
        expires: '2099-01-01',
      });

      vi.mocked(getUserMatchingGameHistory).mockResolvedValueOnce([
        {
          id: 1,
          totalQuestions: 10,
          correctCount: 8,
          clickCount: 10,
          testDate: '2026-03-01T10:00:00Z',
        },
        {
          id: 2,
          totalQuestions: 0,
          correctCount: 0,
          clickCount: 0,
          testDate: '2026-03-02T10:00:00Z',
        },
      ]);

      const component = await SummaryPage({
        searchParams: Promise.resolve({ gameType: 'matching' }),
      });

      render(component);
      expect(getUserMatchingGameHistory).toHaveBeenCalledWith(10);
      expect(screen.getByTestId('summary-client')).toBeInTheDocument();
      expect(screen.getByTestId('summary-client')).toHaveAttribute('data-count', '2');
    });

    it('fetches memory history and renders SummaryClient for memory gameType', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'patient-456', name: 'Patient Memory' },
        expires: '2099-01-01',
      });

      vi.mocked(getUserMemoryGameHistory).mockResolvedValueOnce([
        {
          id: 1,
          correctCount: 5,
          clickCount: 5,
          testDate: '2026-03-05T12:00:00Z',
        },
      ]);

      const component = await SummaryPage({
        searchParams: Promise.resolve({ gameType: 'memory' }),
      });

      render(component);
      expect(getUserMemoryGameHistory).toHaveBeenCalledWith(10);
      expect(screen.getByTestId('summary-client')).toBeInTheDocument();
    });
  });
});
