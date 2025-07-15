import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Inter, Amiri, Saira, Gugi } from 'next/font/google';
import type { ReactNode } from 'react';
import localFont from 'next/font/local';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const amiri = localFont({
  src: [
    {
      path: '../fonts/Amiri-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/Amiri-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-amiri',
});

const saira = Saira({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-saira',
  display: 'swap',
});

const gugi = Gugi({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-gugi',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Quran Search',
  description: 'Search the Quran with translations and Arabic text',
  icons: {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/favicon/favicon.ico',
      },
      {
        rel: 'android-chrome',
        url: '/favicon/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        rel: 'android-chrome',
        url: '/favicon/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  },
  manifest: '/favicon/site.webmanifest'
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${amiri.variable} ${saira.variable} ${gugi.variable}`}>
      <head>
        <link rel="icon" href="/favicon/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/favicon/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
      </head>
      <body className={`${saira.className} font-[--font-saira]`}>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}
