import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Task Vader',
  description: 'Operations task management system for LOLC Holdings PLC',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
