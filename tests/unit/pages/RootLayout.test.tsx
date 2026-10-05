// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RootLayout, { metadata } from '@/app/layout';
import LoginTemplate from '@/app/login/template';

vi.mock('next/font/google', () => ({
  Sarabun: () => ({
    className: 'mock-sarabun-font',
  }),
}));

vi.mock('@/app/components/CookieBanner/CookieBanner', () => ({
  default: () => <div data-testid="cookie-banner">Cookie Banner</div>,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/login',
}));

describe('RootLayout and Page Templates', () => {
  describe('RootLayout (src/app/layout.tsx)', () => {
    it('exports proper application metadata', () => {
      expect(metadata.title).toBe('Vejjarak Lampang Hospital');
      expect(metadata.description).toBe('OT Project');
    });

    it('renders html layout with children and CookieBanner', () => {
      render(
        <RootLayout>
          <div data-testid="app-child">App Content</div>
        </RootLayout>
      );

      expect(screen.getByTestId('app-child')).toBeInTheDocument();
      expect(screen.getByTestId('cookie-banner')).toBeInTheDocument();
    });
  });

  describe('LoginTemplate (src/app/login/template.tsx)', () => {
    it('wraps children inside animated motion.div container', () => {
      render(
        <LoginTemplate>
          <div data-testid="login-content">Login Form</div>
        </LoginTemplate>
      );

      expect(screen.getByTestId('login-content')).toBeInTheDocument();
      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    });
  });
});
