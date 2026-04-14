'use client'

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Auth, saveAuth } from '@/lib/api'

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { t } = useTranslation()
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await Auth.login(formData)

      const accessToken = response.auth?.access_token ?? response.token
      if (!accessToken) {
        throw new Error(t('common.token_missing'))
      }

      saveAuth({
        access_token: accessToken,
        token_type: response.auth?.token_type ?? 'bearer',
        expires_in: response.auth?.expires_in,
      })

      if (response.user.role === 'admin') {
        window.location.href = 'http://localhost:3001/Login'
        return
      }

      window.location.href = '/Dashboard'
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('common.login_failed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{t('common.welcome_back')}</h1>
            <p className="text-foreground/60">{t('common.sign_in_to_account')}</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-8 shadow-sm">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                {t('common.email_address')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('common.email_placeholder')}
                required
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
              />
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-semibold text-foreground">
                  {t('common.password')}
                </label>
                <Link href="#" className="text-sm text-primary hover:text-primary/80 transition">
                  {t('common.forgot_password')}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('common.enter_password')}
                  required
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition"
                  aria-label={t('common.toggle_password_visibility')}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.5 3.5 0 104.967 4.967M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 border border-border rounded bg-background text-primary cursor-pointer focus:ring-2 focus:ring-primary"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-foreground/60 cursor-pointer">
                {t('common.remember_me')}
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? t('common.signing_in') : t('common.sign_in')}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-foreground/60">
              {t('common.dont_have_account')}{' '}
              <Link href="/RegisterMultiStep" className="text-primary hover:text-primary/80 font-semibold transition">
                {t('common.sign_up_here')}
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center text-sm text-foreground/60">
            {t('common.partner_register_prompt')}{' '}<Link href="/RegisterPartner" className="text-primary font-semibold">{t('common.sign_up_here')}</Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

export default LoginPage
