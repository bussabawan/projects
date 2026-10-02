import './globals.css';
import { Sarabun } from 'next/font/google';
import CookieBanner from '@/app/components/CookieBanner/CookieBanner';

const sarabun = Sarabun({
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata = {
  title: 'Vejjarak Lampang Hospital',
  description: 'OT Project',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" className={sarabun.className}>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f5f5f5' }}>
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
