import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { LanguageProvider } from '@/components/language-provider'
import Navbar from '@/components/Navbar'
import PopupHost from '@/components/PopupHost'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Elite Agency - Admin Panel',
  description: 'Manage Ethiopian job seekers and international employment opportunities. Secure administrative portal for profile verification, document management, and job application tracking.',
  generator: 'Elite',
  keywords: 'admin, recruitment, employment, Elite Agency, job portal management',
  icons: {
    icon: '/logo.jpeg',
    apple: '/logo.jpeg',
  },

}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <LanguageProvider>
          <Navbar />
          {children}
          <PopupHost />
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}
