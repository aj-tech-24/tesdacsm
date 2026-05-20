import type { Metadata } from 'next'
import { Geist, Geist_Mono, Playfair_Display, Poppins } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _playfairDisplay = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["700", "800", "900"]
});
const _poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: 'Client Satisfaction Measurement',
  description: 'TESDA Client Satisfaction Measurement Form - Help us serve you better',
  generator: 'v0.app',
  icons: {
    icon: '/tesda-logo.png',
    shortcut: '/tesda-logo.png',
    apple: '/tesda-logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Toaster richColors position="bottom-right" />
        <Analytics />
      </body>
    </html>
  )
}
