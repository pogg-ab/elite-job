'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getAdminToken, clearAdminAuth, Auth } from '@/lib/api'
import { usePathname } from 'next/navigation'

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const pathname = usePathname()

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
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.jpeg" alt="Elite" className="w-10 h-10 object-contain rounded-md" />

            <span className="font-bold text-xl text-foreground hidden sm:inline">Elite</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant="ghost" className="text-foreground hover:text-primary hover:bg-primary/5">
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
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
                className="h-9 rounded-xl border-primary/25 bg-primary/6 px-4 font-semibold text-primary hover:border-primary/45 hover:bg-primary/12"
              >
                Logout
              </Button>
            ) : (
              <Button asChild variant="outline" className="h-9 rounded-xl border-primary/25 bg-primary/6 px-4 font-semibold text-primary hover:border-primary/45 hover:bg-primary/12">
                <Link href="/Login" className="hidden sm:block">
                  Login
                </Link>
              </Button>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-primary/5 rounded-lg transition"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                Logout
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
