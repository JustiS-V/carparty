import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'CarParty — сповіщення про авто з Telegram, OLX та AUTO.RIA',
  description:
    'Моніторинг оголошень про авто в Україні. Фільтри за маркою, бюджетом і містом. Сповіщення в Telegram за секунди.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
