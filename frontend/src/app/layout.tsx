import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HireHub | Modern Full-Stack Job Portal',
  description: 'Connect high-growth companies with premier engineering, design, and product talent.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
