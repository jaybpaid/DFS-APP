import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DFS Optimizer Pro',
  description:
    'Production-ready NFL/NBA DFS Optimizer - Rival to Stokastic, SaberSim, RotoWire',
  keywords: [
    'DFS',
    'Daily Fantasy Sports',
    'NFL',
    'NBA',
    'Optimizer',
    'DraftKings',
    'FanDuel',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className='h-full'>
      <body className={`${inter.className} h-full bg-gray-50`}>
        <Providers>
          <div className='flex h-full'>
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <div className='flex-1 flex flex-col overflow-hidden'>
              {/* Header */}
              <Header />

              {/* Page Content */}
              <main className='flex-1 overflow-auto p-6'>{children}</main>
            </div>
          </div>

          {/* Toast Notifications */}
          <Toaster
            position='top-right'
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
