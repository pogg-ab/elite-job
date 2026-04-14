'use client'

import React from 'react'
import Link from 'next/link'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.jpeg" alt="Elite" className="w-8 h-8 object-contain rounded-lg" />
              <span className="font-bold text-lg text-foreground">Elite</span>
            </div>

            <p className="text-foreground/60 text-sm leading-relaxed">
              Connecting Ethiopian professionals with global employment opportunities. Building careers, changing lives.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">For Job Seekers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/Jobs" className="text-foreground/60 hover:text-primary transition">Browse Jobs</Link></li>
              <li><Link href="/RegisterMultiStep" className="text-foreground/60 hover:text-primary transition">Create Profile</Link></li>
              <li><Link href="/Dashboard" className="text-foreground/60 hover:text-primary transition">My Dashboard</Link></li>
              <li><a href="#" className="text-foreground/60 hover:text-primary transition">How It Works</a></li>
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">For Employers</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-foreground/60 hover:text-primary transition">Post Jobs</a></li>
              <li><a href="/admin" className="text-foreground/60 hover:text-primary transition">Employer Dashboard</a></li>
              <li><a href="#" className="text-foreground/60 hover:text-primary transition">Pricing</a></li>
              <li><a href="#" className="text-foreground/60 hover:text-primary transition">Features</a></li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/Contact" className="text-foreground/60 hover:text-primary transition">Contact Us</Link></li>
              <li><a href="#" className="text-foreground/60 hover:text-primary transition">FAQs</a></li>
              <li><a href="#" className="text-foreground/60 hover:text-primary transition">Privacy Policy</a></li>
              <li><a href="#" className="text-foreground/60 hover:text-primary transition">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-foreground/60">
            <p>&copy; {currentYear} Elite Global Employment. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-primary transition">LinkedIn</a>
              <a href="#" className="hover:text-primary transition">Twitter</a>
              <a href="#" className="hover:text-primary transition">Facebook</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
