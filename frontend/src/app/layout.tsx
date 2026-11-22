import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';
import { Navbar } from '@/components/common/navbar';
import { Footer } from '@/components/common/footer';

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
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-brand-500 selection:text-white">
        <QueryProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
