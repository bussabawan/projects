import './globals.css';
import Footer from '@/app/components/Footer/Footer';

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
    <html lang="th">
      <body style={{ margin: 0, padding: 0, fontFamily: 'sans-serif', backgroundColor: '#f5f5f5' }}>
        {children}
        <Footer />
      </body>
    </html>
  )
}
