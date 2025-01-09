// app/layout.tsx
'use client';

import { Inter } from 'next/font/google';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ErrorProvider } from '@/context/ErrorContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorProvider>
          <DndProvider backend={HTML5Backend}>
            {children}
          </DndProvider>
        </ErrorProvider>
      </body>
    </html>
  );
}