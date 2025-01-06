// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ClientDndProvider from '@/components/common/ClientDndProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UW Course Planner',
  description: 'Plan your UW-Madison courses with ease',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientDndProvider>
          {children}
        </ClientDndProvider>
      </body>
    </html>
  );
}