import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { LanguageProvider } from '@/components/language-provider'
import GlobalAutoTranslator from '@/components/GlobalAutoTranslator'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Elite - Global Employment Portal',
  description: 'Connect Ethiopian job seekers with international employers across Europe, Middle East, and Asia. Secure portal for profile management, document uploads, and job applications.',
  generator: 'Elite',
  keywords: 'recruitment, employment, Ethiopian jobs, international careers, job portal',
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
          <GlobalAutoTranslator />
          {children}
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}
