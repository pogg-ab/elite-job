'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getAdminToken, clearAdminAuth, Auth } from '@/lib/api'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useLanguage } from './language-provider'

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const pathname = usePathname()

  const { t } = useTranslation()
  const { language, setLanguage } = useLanguage()

  // hide navbar on the login page
  if (pathname && pathname.toLowerCase() === '/login') {
    return null
  }

  useEffect(() => {
    setIsAuthenticated(Boolean(getAdminToken()))
  }, [])

  const links = [
    { label: 'Dashboard', href: '/Dashboard' },
    { label: 'Homepage', href: '/Homepage' },
    { label: 'About', href: '/About' },
    { label: 'Jobs', href: '/Jobs' },
    { label: 'Services', href: '/Services' },
    { label: 'Policies', href: '/Policies' },
    { label: 'Employer Requests', href: '/EmployerRequests' },
    { label: 'FAQ', href: '/FAQ' },
    { label: 'Messages', href: '/Messages' },
    { label: 'Users', href: '/Users' },
    { label: 'Staff', href: '/Staff' },
  ]

  return (
    <nav className="bg-primary border-b border-primary/20 sticky top-0 z-50 shadow-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.jpeg" alt="Elite" className="w-10 h-10 object-contain rounded-md border border-white/20" />

            <span className="font-bold text-xl text-white hidden sm:inline">Elite</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant="ghost" className="text-white hover:text-accent hover:bg-white/10">
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Auth / Language */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/10 px-2 py-1 backdrop-blur-lg shadow-inner">
              <div className="relative">
                <select
                  aria-label="Language switcher"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as any)}
                  className="h-9 appearance-none rounded-xl border border-white/20 bg-white/10 px-3 pr-8 text-sm font-semibold text-white outline-none transition-all hover:bg-white/15 focus:border-accent/50 focus:ring-2 focus:ring-accent/20 cursor-pointer"
                >
                  <option value="en" className="bg-primary text-white">EN</option>
                  <option value="am" className="bg-primary text-white">AM</option>
                  <option value="ar" className="bg-primary text-white">AR</option>
                  <option value="or" className="bg-primary text-white">OR</option>
                </select>
                <svg className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.169l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </div>

              {isAuthenticated ? (
                <>
                  <Link href="/Profile">
                    <Button
                      variant="ghost"
                      className="h-9 w-9 rounded-full border border-white/10 p-0 text-white hover:border-accent/40 hover:bg-white/10 hover:text-accent"
                      aria-label="Profile"
                    >
                      <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zM12 14c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
                      </svg>
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await Auth.logout()
                      } catch {
                        // ignore
                      }
                      clearAdminAuth()
                      setIsAuthenticated(false)
                      window.location.href = '/Login'
                    }}
                    className="h-10 rounded-xl border-2 border-accent bg-accent/10 text-accent px-6 font-bold hover:bg-accent hover:text-primary transition-all duration-300 shadow-[0_0_15px_-3px_rgba(197,160,106,0.3)]"
                  >
                    {t('nav.logout')}
                  </Button>
                </>
              ) : (
                <Link href="/Login" className="hidden sm:block">
                  <Button variant="outline" className="h-10 rounded-xl border-2 border-accent bg-accent/10 text-accent px-6 font-bold hover:bg-accent hover:text-primary transition-all duration-300 shadow-[0_0_15px_-3px_rgba(197,160,106,0.3)]">
                    {t('nav.login')}
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-primary/5 rounded-lg transition"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-border pb-4">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant="ghost" className="w-full justify-start text-foreground hover:text-primary hover:bg-primary/5">
                  {link.label}
                </Button>
              </Link>
            ))}
            {isAuthenticated ? (
              <Button
                className="block mt-2"
                onClick={async () => {
                  try {
                    await Auth.logout()
                  } catch {
                    // ignore
                  }
                  clearAdminAuth()
                  setIsAuthenticated(false)
                  window.location.href = '/Login'
                }}
              >
                {t('nav.logout')}
              </Button>
            ) : (
              <Button asChild className="block mt-2">
                <Link href="/Login" className="w-full">
                  <span className="w-full inline-block text-center py-2">{t('nav.login')}</span>
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
