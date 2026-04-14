'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'

const RegisterMultiStep: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Step 2
    phone: '',
    dateOfBirth: '',
    nationality: '',
    // Step 3
    languages: [] as string[],
    experience: '',
    qualifications: '',
    // Step 4
    agreeTerms: false,
    agreePrivacy: false,
  })

  const steps = [
    { num: 1, title: 'Personal Info', desc: 'Basic information' },
    { num: 2, title: 'Contact Details', desc: 'How we reach you' },
    { num: 3, title: 'Professional Info', desc: 'Your background' },
    { num: 4, title: 'Agreement', desc: 'Terms & conditions' }
  ]

  const languages = ['English', 'Amharic', 'Arabic', 'Oromo', 'Tigrinya', 'Somali']
  const experiences = [
    'No experience',
    '0-1 years',
    '1-3 years',
    '3-5 years',
    '5+ years'
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData({
        ...formData,
        [name]: checked
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  const handleLanguageToggle = (lang: string) => {
    setFormData({
      ...formData,
      languages: formData.languages.includes(lang)
        ? formData.languages.filter(l => l !== lang)
        : [...formData.languages, lang]
    })
  }

  const isStep1Valid = formData.firstName && formData.lastName && formData.email && 
                       formData.password && formData.password === formData.confirmPassword

  const isStep2Valid = formData.phone && formData.dateOfBirth && formData.nationality

  const isStep3Valid = formData.languages.length > 0 && formData.experience && formData.qualifications

  const isStep4Valid = formData.agreeTerms && formData.agreePrivacy

  const canProceed = 
    (currentStep === 1 && isStep1Valid) ||
    (currentStep === 2 && isStep2Valid) ||
    (currentStep === 3 && isStep3Valid) ||
    (currentStep === 4)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep === 4 && isStep4Valid) {
      // Final submission
      window.location.href = '/Dashboard'
    } else if (canProceed) {
      setCurrentStep(currentStep + 1)
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Join Elite Today</h1>
          <p className="text-lg text-foreground/60">Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-12">
          {steps.map((step, idx) => (
            <div key={step.num} className="flex-1">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition ${
                    step.num < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step.num === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-border text-foreground/60'
                  }`}
                >
                  {step.num < currentStep ? '✓' : step.num}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition ${
                      step.num < currentStep ? 'bg-primary' : 'bg-border'
                    }`}
                  ></div>
                )}
              </div>
              <div className="mt-2 text-center">
                <p className="text-xs font-semibold text-foreground">{step.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-8 shadow-sm mb-8">
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">{steps[0].title}</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-foreground mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Your first name"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-foreground mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Your last name"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">{steps[1].title}</h2>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-foreground mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+251 9 XX XXX XXXX"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
                />
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-foreground mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
                />
              </div>

              <div>
                <label htmlFor="nationality" className="block text-sm font-semibold text-foreground mb-2">
                  Nationality
                </label>
                <select
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
                >
                  <option value="">Select your nationality</option>
                  <option value="Ethiopian">Ethiopian</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Professional Info */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">{steps[2].title}</h2>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-4">Languages Spoken</label>
                <div className="grid grid-cols-2 gap-3">
                  {languages.map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => handleLanguageToggle(lang)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                        formData.languages.includes(lang)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="experience" className="block text-sm font-semibold text-foreground mb-2">
                  Work Experience
                </label>
                <select
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
                >
                  <option value="">Select your experience level</option>
                  {experiences.map(exp => (
                    <option key={exp} value={exp}>{exp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="qualifications" className="block text-sm font-semibold text-foreground mb-2">
                  Qualifications & Skills
                </label>
                <textarea
                  id="qualifications"
                  name="qualifications"
                  value={formData.qualifications}
                  onChange={handleChange}
                  placeholder="Describe your education, certifications, and key skills..."
                  rows={4}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 4: Agreement */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">{steps[3].title}</h2>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
                <div className="flex gap-3">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="w-5 h-5 border border-border rounded bg-background text-primary cursor-pointer focus:ring-2 focus:ring-primary mt-0.5"
                  />
                  <label htmlFor="agreeTerms" className="cursor-pointer">
                    <p className="font-semibold text-foreground">I agree to the Terms of Service</p>
                    <p className="text-sm text-foreground/60 mt-1">
                      I understand and accept all terms and conditions of the Elite platform
                    </p>
                  </label>
                </div>

                <div className="flex gap-3">
                  <input
                    type="checkbox"
                    id="agreePrivacy"
                    name="agreePrivacy"
                    checked={formData.agreePrivacy}
                    onChange={handleChange}
                    className="w-5 h-5 border border-border rounded bg-background text-primary cursor-pointer focus:ring-2 focus:ring-primary mt-0.5"
                  />
                  <label htmlFor="agreePrivacy" className="cursor-pointer">
                    <p className="font-semibold text-foreground">I agree to the Privacy Policy</p>
                    <p className="text-sm text-foreground/60 mt-1">
                      I consent to the collection and use of my data as described in the Privacy Policy
                    </p>
                  </label>
                </div>
              </div>

              <div className="bg-primary/10 dark:bg-primary/20 border border-primary/25 dark:border-primary/35 rounded-lg p-4">
                <p className="text-sm text-primary dark:text-primary-foreground">
                  ✓ Your account will be created and you'll be taken to the dashboard to complete your profile.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 pt-8 border-t border-border">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-primary/20 text-primary hover:bg-primary/5"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Back
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!canProceed}
            >
              {currentStep === 4 ? 'Create Account' : 'Continue'}
            </Button>
          </div>
        </form>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-foreground/60">
            Already have an account?{' '}
            <Link href="/Login" className="text-primary hover:text-primary/80 font-semibold transition">
              Log in here
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </main>
  )
}

export default RegisterMultiStep

