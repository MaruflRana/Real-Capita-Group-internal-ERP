import type { Metadata } from 'next';
import { IBM_Plex_Mono, Source_Sans_3 } from 'next/font/google';

import { APP_NAME } from '@real-capita/config';

import './global.css';

const sans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-sans',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: `${APP_NAME} | Workspace`,
  description: 'Production foundation for the Real Capita Group internal ERP.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${sans.variable} ${mono.variable}`} lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
