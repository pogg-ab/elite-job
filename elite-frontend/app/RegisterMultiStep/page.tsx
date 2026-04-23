'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Auth, saveAuth, API_BASE_URL } from '@/lib/api'
import { useTranslation } from 'react-i18next'
import { isValidEthiopianPhone, phoneValidationMessage, normalizeEthiopianPhone } from '@/lib/validation'

const RegisterMultiStep: React.FC = () => {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    // Step 1
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Step 2
    gender: '',
    age: '',
    dateOfBirth: '',
    nationality: '',
    address: '',
    passportStatus: '',
    educationLevel: '',
    experienceSummary: '',
    preferredCountry: '',
    skills: '',
    preferredLanguage: 'en',
    // Step 3
    agreeTerms: false,
    agreePrivacy: false,
    // OTP
    otp: '',
  })

  const [showOtp, setShowOtp] = useState(false)
 

  const steps = [
    { num: 1, title: t('registerPage.registration'), desc: t('registerPage.basicInfo') },
    { num: 2, title: t('registerPage.profileDetails'), desc: t('registerPage.professionalDetails') },
    { num: 3, title: t('registerPage.agreement'), desc: t('registerPage.termsConditions') }
  ]

  const educationLevels = [
    'Primary',
    'Secondary',
    'Diploma',
    'Bachelor',
    'Master',
    'Other'
  ]

  const validateField = (name: string, value: any, latestData?: typeof formData) => {
    const data = latestData || formData
    let errorMsg = ''
    switch (name) {
      case 'fullName':
        if (!value || !String(value).trim()) errorMsg = 'Full name is required'
        break
      case 'email':
        if (!value || !String(value).trim()) errorMsg = 'Email is required'
        else if (!validateEmail(value)) errorMsg = 'Invalid email'
        break
      case 'phone':
        if (!value || !String(value).trim()) errorMsg = 'Phone is required'
        else if (!isValidEthiopianPhone(value)) errorMsg = 'Invalid Ethiopian phone number'
        break
      case 'password':
        if (!value) errorMsg = 'Password is required'
        else if (String(value).length < 8) errorMsg = 'Password must be at least 8 characters'
        break
      case 'confirmPassword':
        if (!value) errorMsg = 'Please confirm your password'
        else if (value !== data.password) errorMsg = 'Passwords do not match'
        break
      case 'gender':
        if (!value) errorMsg = 'Gender is required'
        break
      case 'age':
        if (!value) errorMsg = 'Age is required'
        else if (Number(value) < 18 || Number(value) > 65) errorMsg = 'Age must be between 18 and 65'
        break
      case 'educationLevel':
        if (!value) errorMsg = 'Education level is required'
        break
      case 'experienceSummary':
        if (!value || !String(value).trim()) errorMsg = 'Experience summary is required'
        break
      case 'passportStatus':
        if (!value) errorMsg = 'Passport status is required'
        break
    }

    setErrors(prev => ({
      ...prev,
      [name]: errorMsg
    }))
    return !errorMsg
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    validateField(name, value)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData({
        ...formData,
        [name]: checked
      })
    } else {
      let updatedData = { ...formData, [name]: value }
      
      if (name === 'dateOfBirth' && value) {
        const birthDate = new Date(value)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
        updatedData.age = String(age)
        validateField('age', String(age), updatedData)
      }

      setFormData(updatedData)
      if (name === 'phone') setPhoneError(null)
      
      // Clear error on change if it was previously set
      if (errors[name]) {
        validateField(name, value, updatedData)
      }
    }
  }

  const isStep1Valid = formData.fullName && formData.email && formData.phone &&
                       formData.password && formData.password === formData.confirmPassword

  const isStep2Valid = formData.gender && formData.age && formData.educationLevel &&
                       formData.experienceSummary && formData.passportStatus

  

  

  // Policies fetched for step 4 display (full objects)
  const [termsPolicy, setTermsPolicy] = useState<any | null>(null)
  const [privacyPolicy, setPrivacyPolicy] = useState<any | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'terms'|'privacy'|null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? API_BASE_URL ?? 'http://127.0.0.1:8000'
        const resTerms = await (await fetch(`${base}/api/policies/terms`)).json()
        const resPrivacy = await (await fetch(`${base}/api/policies/privacy`)).json()
        if (!mounted) return
        setTermsPolicy(resTerms?.data ?? null)
        setPrivacyPolicy(resPrivacy?.data ?? null)
      } catch {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [])

  // Determine which agreements are required based on available policies
  const requiredTerms = Boolean(termsPolicy)
  const requiredPrivacy = Boolean(privacyPolicy)

  const isStep3Valid = (requiredTerms ? formData.agreeTerms : true) && (requiredPrivacy ? formData.agreePrivacy : true)

  const canProceed = 
    (currentStep === 1 && isStep1Valid) ||
    (currentStep === 2 && isStep2Valid) ||
    (currentStep === 3 && isStep3Valid)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    // validate current step before proceeding
    const runValidate = (step: number) => validateStep(step)

    if (currentStep !== 3) {
      const ok = runValidate(currentStep)
      if (!ok) return
      setCurrentStep(currentStep + 1)
      return
    }

    if (currentStep === 3 && isStep3Valid) {
      setIsSubmitting(true)

      try {
        // validate phone before submit
        if (!isValidEthiopianPhone(formData.phone)) {
          const msg = phoneValidationMessage(formData.phone)
          setPhoneError(msg)
          setError(msg)
          setIsSubmitting(false)
          return
        }
        // normalize for payload
        formData.phone = normalizeEthiopianPhone(formData.phone)
        const payload = {
          name: formData.fullName.trim(),
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.confirmPassword,
          phone: formData.phone,
          preferred_language: formData.preferredLanguage || 'en',
          profile: {
            full_name: formData.fullName.trim(),
            gender: formData.gender || null,
            age: Number(formData.age),
            passport_status: formData.passportStatus || null,
            date_of_birth: formData.dateOfBirth || null,
            nationality: formData.nationality || null,
            address: formData.address || null,
            education_level: formData.educationLevel || null,
            experience_summary: formData.experienceSummary || null,
            preferred_country: formData.preferredCountry || null,
            skills: formData.skills
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s.length > 0),
          },
        }

        const response = await Auth.register(payload) as any

        if (response.status === 'otp_required') {
          setShowOtp(true)
          setIsSubmitting(false)
          return
        }

        const accessToken = response.auth?.access_token ?? response.token
        if (accessToken) {
          saveAuth({
            access_token: accessToken,
            token_type: response.auth?.token_type ?? 'bearer',
            expires_in: response.auth?.expires_in,
          })
        }

        window.location.href = '/Dashboard'
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : t('registerPage.registrationFailed'))
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  function validateStep(step: number) {
    const next: Record<string, string> = {}
    if (step === 1) {
      if (!formData.fullName || !String(formData.fullName).trim()) next.fullName = 'Full name is required'
      if (!formData.email || !String(formData.email).trim()) next.email = 'Email is required'
      else if (!validateEmail(formData.email)) next.email = 'Invalid email'
      if (!formData.phone || !String(formData.phone).trim()) next.phone = 'Phone is required'
      else if (!isValidEthiopianPhone(formData.phone)) next.phone = 'Invalid Ethiopian phone number'
      if (!formData.password) next.password = 'Password is required'
      else if (String(formData.password).length < 8) next.password = 'Password must be at least 8 characters'
      if (!formData.confirmPassword) next.confirmPassword = 'Please confirm your password'
      else if (formData.password !== formData.confirmPassword) next.confirmPassword = 'Passwords do not match'
    }

    if (step === 2) {
      if (!formData.gender) next.gender = 'Gender is required'
      if (!formData.age) next.age = 'Age is required'
      else if (Number(formData.age) < 18 || Number(formData.age) > 65) next.age = 'Age must be between 18 and 65'
      if (!formData.educationLevel) next.educationLevel = 'Education level is required'
      if (!formData.experienceSummary || !String(formData.experienceSummary).trim()) next.experienceSummary = 'Experience summary is required'
      if (!formData.passportStatus) next.passportStatus = 'Passport status is required'
    }

    if (step === 3) {
      if (requiredTerms && !formData.agreeTerms) next.agreeTerms = 'You must agree to the terms'
      if (requiredPrivacy && !formData.agreePrivacy) next.agreePrivacy = 'You must agree to the privacy policy'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function markdownToHtml(md: string | null) {
    if (!md) return ''
    // very small markdown -> html converter for headings and links and paragraphs
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    // headings
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>')
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    // paragraphs
    html = html.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('')
    return html
  }

  return (
    <main className="min-h-screen flex flex-col bg-linear-to-b from-primary/5 via-background to-background">
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8 rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
          <h1 className="text-4xl font-bold text-foreground mb-2">{t('registerPage.joinTitle')}</h1>
          <p className="text-lg text-foreground/60">{t('registerPage.stepLabel')} {currentStep} {t('registerPage.of')} {steps.length}: {steps[currentStep - 1]?.title ?? ''}</p>
        </div>

        {/* Progress Steps */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {steps.map((step, idx) => (
            <div key={step.num} className="rounded-xl border border-border/60 bg-card/70 p-3">
              <div className="flex items-center justify-center">
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
              </div>
              <div className="mt-2 text-center">
                <p className="text-xs font-semibold text-foreground">{step.title}</p>
                <p className="text-[11px] text-foreground/60">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card border border-border/70 rounded-2xl p-6 md:p-8 shadow-sm mb-8">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Registration */}
          {currentStep === 1 && !showOtp && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">{steps[0].title}</h2>

              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-foreground mb-2">
                  {t('registerPage.fullName')}
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t('registerPage.yourFullName')}
                  className={`w-full px-4 py-3 border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none ${errors.fullName ? 'border-red-400' : 'border-border'}`}
                />
                {errors.fullName && <p className="mt-2 text-sm text-red-600">{errors.fullName}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                  {t('registerPage.email')}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="you@example.com"
                  className={`w-full px-4 py-3 border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none ${errors.email ? 'border-red-400' : 'border-border'}`}
                />
                {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-foreground mb-2">
                  {t('registerPage.phone')}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="+2519XXXXXXXX"
                  className={`w-full px-4 py-3 border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none ${errors.phone ? 'border-red-400' : 'border-border'}`}
                />
                {errors.phone && <p className="mt-2 text-sm text-red-600">{errors.phone}</p>}
                {!errors.phone && <p className="mt-2 text-sm text-foreground/60">+2519XXXXXXXX</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                    {t('registerPage.password')}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t('registerPage.createStrongPassword')}
                    className={`w-full px-4 py-3 border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none ${errors.password ? 'border-red-400' : 'border-border'}`}
                  />
                  {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground mb-2">
                    {t('registerPage.confirmPassword')}
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t('registerPage.confirmYourPassword')}
                    className={`w-full px-4 py-3 border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none ${errors.confirmPassword ? 'border-red-400' : 'border-border'}`}
                  />
                  {errors.confirmPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Profile Details */}
          {currentStep === 2 && !showOtp && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">{steps[1].title}</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                <label htmlFor="gender" className="block text-sm font-semibold text-foreground mb-2">
                  {t('registerPage.gender')}
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none ${errors.gender ? 'border-red-400' : 'border-border'}`}
                >
                  <option value="">{t('registerPage.selectGender')}</option>
                  <option value="male">{t('registerPage.male')}</option>
                  <option value="female">{t('registerPage.female')}</option>
                </select>
                {errors.gender && <p className="mt-2 text-sm text-red-600">{errors.gender}</p>}
                </div>

                <div>
                  <label htmlFor="age" className="block text-sm font-semibold text-foreground mb-2">{t('registerPage.age')}</label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    min={18}
                    max={65}
                    value={formData.age}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="18 - 65"
                      className={`w-full px-4 py-3 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none ${errors.age ? 'border-red-400' : 'border-border'}`}
                  />
                    {errors.age && <p className="mt-2 text-sm text-red-600">{errors.age}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-foreground mb-2">Date of birth</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="nationality" className="block text-sm font-semibold text-foreground mb-2">Nationality</label>
                  <input
                    type="text"
                    id="nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Ethiopian"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-semibold text-foreground mb-2">Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="City, sub-city, kebele..."
                  rows={2}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none resize-none"
                />
              </div>

              <div>
                <label htmlFor="educationLevel" className="block text-sm font-semibold text-foreground mb-2">{t('registerPage.education')}</label>
                <select id="educationLevel" name="educationLevel" value={formData.educationLevel} onChange={handleChange} onBlur={handleBlur} className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none">
                  <option value="">{t('registerPage.selectEducation')}</option>
                  {educationLevels.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                {errors.educationLevel && <p className="mt-2 text-sm text-red-600">{errors.educationLevel}</p>}
              </div>

              <div>
                <label htmlFor="experienceSummary" className="block text-sm font-semibold text-foreground mb-2">{t('registerPage.experience')}</label>
                <textarea id="experienceSummary" name="experienceSummary" value={formData.experienceSummary} onChange={handleChange} onBlur={handleBlur} placeholder={t('registerPage.experiencePlaceholder')} rows={4} className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none resize-none" />
                {errors.experienceSummary && <p className="mt-2 text-sm text-red-600">{errors.experienceSummary}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="preferredCountry" className="block text-sm font-semibold text-foreground mb-2">Preferred country</label>
                  <input
                    type="text"
                    id="preferredCountry"
                    name="preferredCountry"
                    value={formData.preferredCountry}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="UAE, Saudi Arabia..."
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="skills" className="block text-sm font-semibold text-foreground mb-2">Skills</label>
                  <input
                    type="text"
                    id="skills"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Cooking, Driving, Welding"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="passportStatus" className="block text-sm font-semibold text-foreground mb-2">{t('registerPage.passportStatus')}</label>
                <select id="passportStatus" name="passportStatus" value={formData.passportStatus} onChange={handleChange} onBlur={handleBlur} className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none">
                  <option value="">{t('registerPage.selectPassportStatus')}</option>
                  <option value="valid">{t('registerPage.validPassport')}</option>
                  <option value="expired">{t('registerPage.expiredPassport')}</option>
                  <option value="applied">{t('registerPage.appliedInProcess')}</option>
                  <option value="none">{t('registerPage.noPassport')}</option>
                </select>
                {errors.passportStatus && <p className="mt-2 text-sm text-red-600">{errors.passportStatus}</p>}
              </div>

              <div>
                <label htmlFor="preferredLanguage" className="block text-sm font-semibold text-foreground mb-2">{t('registerPage.preferredLanguage')}</label>
                <select id="preferredLanguage" name="preferredLanguage" value={formData.preferredLanguage} onChange={handleChange} className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none">
                  <option value="en">{t('registerPage.languages.english')}</option>
                  <option value="am">{t('registerPage.languages.amharic')}</option>
                  <option value="ar">{t('registerPage.languages.arabic')}</option>
                  <option value="or">{t('registerPage.languages.oromo')}</option>
                </select>
              </div>

              {/* partner fields removed — partner registration uses separate page */}
            </div>
          )}

          {/* Step 3: Agreement */}
          {currentStep === 3 && !showOtp && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">{steps[2].title}</h2>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
                {requiredTerms && (
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
                      <p className="font-semibold text-foreground">{t('registerPage.agreeTerms')}</p>
                      <p className="text-sm text-foreground/60 mt-1">
                        {t('registerPage.agreeTermsDesc')}{' '}
                        {termsPolicy && (
                          <button type="button" onClick={() => { setModalType('terms'); setModalOpen(true) }} className="text-primary underline ml-1">{t('registerPage.read')}</button>
                        )}
                      </p>
                    </label>
                  </div>
                )}

                {requiredPrivacy && (
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
                      <p className="font-semibold text-foreground">{t('registerPage.agreePrivacy')}</p>
                      <p className="text-sm text-foreground/60 mt-1">
                        {t('registerPage.agreePrivacyDesc')}{' '}
                        {privacyPolicy && (
                          <button type="button" onClick={() => { setModalType('privacy'); setModalOpen(true) }} className="text-primary underline ml-1">{t('registerPage.read')}</button>
                        )}
                      </p>
                    </label>
                  </div>
                )}
              </div>

              {(errors.agreeTerms || errors.agreePrivacy) && (
                <div className="mt-2">
                  {errors.agreeTerms && <p className="text-sm text-red-600">{errors.agreeTerms}</p>}
                  {errors.agreePrivacy && <p className="text-sm text-red-600">{errors.agreePrivacy}</p>}
                </div>
              )}

              <div className="bg-primary/10 dark:bg-primary/20 border border-primary/25 dark:border-primary/35 rounded-lg p-4">
                <p className="text-sm text-primary dark:text-primary-foreground">
                  ✓ {t('registerPage.accountCreatedInfo')}
                </p>
              </div>
            </div>
          )}

          {/* Step 4: OTP Verification */}
          {showOtp && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Verify Your Email</h2>
                <p className="text-foreground/60 mt-2">
                  We've sent a 6-digit verification code to <span className="font-semibold text-primary">{formData.email}</span>.
                  Please enter it below to complete your registration.
                </p>
              </div>

              <div className="flex justify-center">
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="000000"
                  maxLength={6}
                  className="w-64 text-center text-4xl tracking-[0.25em] font-mono px-6 py-4 border-2 border-primary/20 rounded-xl bg-background text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none shadow-sm"
                  required
                />
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtp(false)
                    setError('')
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Edit Email Address
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-border">
            {!showOtp && currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-primary/20 text-primary hover:bg-primary/5 h-11"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                {t('registerPage.back')}
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold disabled:opacity-50 disabled:cursor-not-allowed h-11"
              disabled={isSubmitting || (showOtp && (formData.otp?.length ?? 0) !== 6)}
            >
              {isSubmitting
                ? t('registerPage.creatingAccount')
                : showOtp
                ? 'Verify & Create Account'
                : currentStep === 3
                ? t('registerPage.createAccount')
                : t('registerPage.continue')}
            </Button>
          </div>
        </form>

        {/* Policy Modal */}
        {modalOpen && modalType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
            <div className="relative max-w-3xl w-full mx-4 bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 overflow-auto max-h-[80vh]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">{modalType === 'terms' ? t('registerPage.termsOfService') : t('registerPage.privacyPolicy')}</h3>
                <button onClick={() => setModalOpen(false)} className="text-foreground/60">{t('registerPage.close')}</button>
              </div>
                      <div className="prose max-w-none text-foreground">
                        {modalType === 'terms' && termsPolicy?.file_path ? (
                          <iframe src={`${API_BASE_URL}/api/policies/${termsPolicy.id}/download`} className="w-full h-[70vh] border" />
                        ) : modalType === 'privacy' && privacyPolicy?.file_path ? (
                          <iframe src={`${API_BASE_URL}/api/policies/${privacyPolicy.id}/download`} className="w-full h-[70vh] border" />
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: markdownToHtml(modalType === 'terms' ? termsPolicy?.content ?? null : privacyPolicy?.content ?? null) }} />
                        )}
                      </div>
            </div>
          </div>
        )}

        {/* Login Link */}
        <div className="text-center">
          <p className="text-foreground/60">
            {t('registerPage.alreadyAccount')}{' '}
            <Link href="/Login" className="text-primary hover:text-primary/80 font-semibold transition">
              {t('registerPage.loginHere')}
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </main>
  )
}

export default RegisterMultiStep
