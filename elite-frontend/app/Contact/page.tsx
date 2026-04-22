'use client'

import React, { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Profile, Messages, Faqs, getAccessToken } from '@/lib/api'
import { useTranslation } from 'react-i18next'

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '251920156360'

const ContactPage: React.FC = () => {
  const { t } = useTranslation()
  const LOCAL_HISTORY_KEY = 'hijira_contact_history'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    category: 'General'
  })
  const [user, setUser] = useState<any | null>(null)
  const [authResolved, setAuthResolved] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [myMessages, setMyMessages] = useState<any[]>([])
  const [openReplyId, setOpenReplyId] = useState<string | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [replySubmittingId, setReplySubmittingId] = useState<string | null>(null)
  const [faqs, setFaqs] = useState<any[] | null>(null)
  const [askQuestion, setAskQuestion] = useState('')
  const [askName, setAskName] = useState('')
  const [askEmail, setAskEmail] = useState('')
  const [askSubmitting, setAskSubmitting] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotice({ type, message })
  }

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), 3200)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const persistGuestHistory = (messages: any[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(messages.slice(0, 20)))
    }
  }

  const appendReplyToMessage = (messageId: string, replyText: string) => {
    const localReply = {
      id: `local-reply-${Date.now()}`,
      sender: user?.name ?? 'You',
      message: replyText,
      created_at: new Date().toLocaleString(),
    }

    setMyMessages((prev) => {
      const updated = prev.map((msg) => {
        if (String(msg.id) !== messageId) return msg
        return {
          ...msg,
          replies: [...(msg.replies ?? []), localReply],
        }
      })

      if (!user) {
        persistGuestHistory(updated)
      }

      return updated
    })
  }

  const handleReplySubmit = async (messageItem: any) => {
    const messageId = String(messageItem.id)
    const replyText = (replyDrafts[messageId] ?? '').trim()

    if (!replyText) return

    setReplySubmittingId(messageId)

    try {
      if (user && !String(messageItem.id).startsWith('local-')) {
        await Messages.reply(messageItem.id, { message: replyText })
        const msgs = await Messages.my() as any
        setMyMessages(msgs.data ?? msgs)
      } else {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000'
        const subject = String(messageItem.subject ?? '').startsWith('Re:')
          ? String(messageItem.subject)
          : `Re: ${String(messageItem.subject ?? 'Support')}`

        const payload = {
          name: user?.name ?? formData.name,
          email: user?.email ?? messageItem.email ?? formData.email,
          phone: user?.phone ?? formData.phone,
          subject,
          message: replyText,
          category: messageItem.category ?? 'General',
        }

        const res = await fetch(`${base}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) throw new Error(t('contactPage.replySendFailed'))
        appendReplyToMessage(messageId, replyText)
      }

      setReplyDrafts((prev) => ({ ...prev, [messageId]: '' }))
      setOpenReplyId(null)
      showNotice('success', t('contactPage.replySent'))
    } catch (err) {
      console.error(err)
      showNotice('error', t('contactPage.replySendFailed'))
    } finally {
      setReplySubmittingId(null)
    }
  }

  const handleDeleteMessage = async (messageItem: any) => {
    const messageId = String(messageItem.id)
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Delete this message thread?')
      if (!confirmed) return
    }

    try {
      if (user && !messageId.startsWith('local-')) {
        await Messages.delete(messageItem.id)
      }

      setMyMessages((prev) => {
        const updated = prev.filter((m) => String(m.id) !== messageId)
        if (!user) {
          persistGuestHistory(updated)
        }
        return updated
      })

      setOpenReplyId((prev) => (prev === messageId ? null : prev))
      setReplyDrafts((prev) => {
        const next = { ...prev }
        delete next[messageId]
        return next
      })

      showNotice('success', 'Message deleted successfully')
    } catch (err) {
      console.error(err)
      showNotice('error', 'Failed to delete message')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000'
      const senderEmail = user?.email ?? formData.email
      // validate phone if provided (guest users)
      if (!user) {
        const { isValidEthiopianPhone, phoneValidationMessage, normalizeEthiopianPhone } = await import('@/lib/validation')
        if (!isValidEthiopianPhone(formData.phone)) {
          setIsSubmitting(false)
          showNotice('error', phoneValidationMessage(formData.phone))
          return
        }
        formData.phone = normalizeEthiopianPhone(formData.phone)
      }

      const payload = {
        name: formData.name,
        email: senderEmail,
        phone: user?.phone ?? formData.phone,
        subject: formData.subject,
        message: formData.message,
        category: formData.category,
      }

      const res = await fetch(`${base}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(t('contactPage.sendFailed'))

      const localMessage = {
        id: `local-${Date.now()}`,
        subject: formData.subject,
        message: formData.message,
        email: user?.email ?? formData.email,
        phone: user?.phone ?? formData.phone,
        category: formData.category,
        created_at: new Date().toLocaleString(),
        replies: [],
      }

      if (user) {
        try {
          const msgs = await Messages.my() as any
          setMyMessages(msgs.data ?? msgs)
        } catch {
          setMyMessages((prev) => [localMessage, ...prev])
        }
      } else {
        setMyMessages((prev) => {
          const updated = [localMessage, ...prev].slice(0, 20)
          persistGuestHistory(updated)
          return updated
        })
      }

      setSubmitted(true)
      setFormData({ name: '', email: '', phone: '', subject: '', message: '', category: 'General' })
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err) {
      console.error(err)
      showNotice('error', t('contactPage.sendFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    let mounted = true

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCAL_HISTORY_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            setMyMessages(parsed)
          }
        }
      } catch {
        // ignore local history parsing errors
      }
    }

    ; (async () => {
      if (!getAccessToken()) {
        if (mounted) setAuthResolved(true)
        return
      }

      try {
        const p = await Profile.get() as any
        if (!mounted) return
        // Profile.get returns user object when authenticated
        if (p && (p as any).email) {
          setUser(p)
          setFormData((prev) => ({
            ...prev,
            name: p.name ?? prev.name,
            email: p.email ?? prev.email,
            phone: p.phone ?? prev.phone,
          }))
          try {
            const msgs = await Messages.my() as any
            setMyMessages(msgs.data ?? msgs)
          } catch (e) {
            // ignore
          }
          try {
            const list = await Faqs.list() as any
            setFaqs(list.data ?? list)
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        // not logged in or failed — local history (if any) remains visible
      } finally {
        if (mounted) setAuthResolved(true)
      }
    })()
    return () => { mounted = false }
  }, [])

  const contactMethods = [
    {
      icon: '📧',
      title: t('contactPage.methods.email'),
      description: t('contactPage.methods.emailDesc'),
      value: t('contactPage.methods.emailValue')
    },
    {
      icon: '📞',
      title: t('contactPage.methods.phone'),
      description: t('contactPage.methods.phoneDesc'),
      value: t('contactPage.methods.phoneValue')
    },
    {
      icon: '📍',
      title: t('contactPage.methods.office'),
      description: t('contactPage.methods.officeDesc'),
      value: t('contactPage.methods.officeValue')
    }
  ]

  const fallbackFaqs = [
    {
      question: t('contactPage.faqs.createAccountQuestion'),
      answer: t('contactPage.faqs.createAccountAnswer')
    },
    {
      question: t('contactPage.faqs.verifyDocsQuestion'),
      answer: t('contactPage.faqs.verifyDocsAnswer')
    },
    {
      question: t('contactPage.faqs.verificationTimeQuestion'),
      answer: t('contactPage.faqs.verificationTimeAnswer')
    },
    {
      question: t('contactPage.faqs.multipleJobsQuestion'),
      answer: t('contactPage.faqs.multipleJobsAnswer')
    }
  ]

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60 bg-linear-to-br from-primary/10 via-background to-primary/5 px-4 py-14 md:py-20 dark:from-primary/25 dark:via-background dark:to-primary/15">
        <div className="pointer-events-none absolute -left-20 top-8 h-56 w-56 rounded-full bg-primary/20 blur-3xl dark:bg-primary/15" />
        <div className="pointer-events-none absolute -right-16 -top-8 h-56 w-56 rounded-full bg-primary/15 blur-3xl dark:bg-primary/20" />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-primary/30 bg-white/70 px-3 py-1 text-xs font-semibold tracking-wide text-primary shadow-sm dark:border-primary/40 dark:bg-primary/15 dark:text-primary-foreground">
              Support Center
            </span>
            <h1 className="mt-4 text-4xl font-black leading-tight text-foreground md:text-6xl">{t('contactPage.title')}</h1>
            <p className="mt-4 text-lg text-foreground/70 md:text-xl">{t('contactPage.subtitle')}</p>
          </div>
        </div>
      </section>

      <div className="flex-1 mx-auto w-full max-w-7xl px-4 py-12 md:py-14">
        {/* Contact Methods */}
        <div className="mb-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {contactMethods.map((method, idx) => (
            <div key={idx} className="group rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg dark:hover:border-primary/55">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/10 text-2xl ring-1 ring-primary/25 dark:from-primary/30 dark:to-primary/20 dark:ring-primary/35">
                {method.icon}
              </div>
              <h3 className="text-base font-bold text-foreground md:text-lg">{method.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/65">{method.description}</p>
              <p className="mt-3 text-sm font-semibold text-primary dark:text-primary-foreground">{method.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm md:p-8">
              <h2 className="mb-6 text-2xl font-black text-foreground md:text-3xl">{t('contactPage.sendMessageTitle')}</h2>

              {submitted && (
                <div className="mb-6 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 dark:border-primary/40 dark:bg-primary/20">
                  <p className="font-semibold text-primary dark:text-primary-foreground">✓ {t('contactPage.messageSent')}</p>
                  <p className="text-sm text-primary/85 dark:text-primary-foreground/90">{t('contactPage.messageSentSub')}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Field */}
                <div>

                  {/* WhatsApp floating button */}
                  <a
                    href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hello I need information')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="fixed right-4 bottom-6 z-50 inline-flex items-center gap-3 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg hover:bg-primary/90"

                    aria-label="Chat on WhatsApp"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12.079a9 9 0 10-2.63 6.18L21 21l-1.73-4.73A8.96 8.96 0 0021 12.079z" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M17.5 12.5c-.2.5-1.1 1.4-1.8 1.6-.7.2-1.2.2-1.6-.2-.4-.4-1-1.4-1.3-1.9-.3-.5-.7-.4-1.2-.3-.5.1-1 .4-1.5.4-.5 0-.9-.3-1.4-.9" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span className="font-semibold">Chat on WhatsApp</span>
                  </a>
                  <label htmlFor="name" className="mb-2 block text-sm font-semibold text-foreground">
                    {t('contactPage.fullName')}
                  </label>

                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t('contactPage.yourName')}
                    required
                    className="w-full rounded-xl border border-border/80 bg-background px-4 py-3 text-foreground shadow-sm outline-none transition placeholder:text-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:focus:border-primary dark:focus:ring-primary/45"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-foreground">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+2519XXXXXXXX"
                    required
                    className="w-full rounded-xl border border-border/80 bg-background px-4 py-3 text-foreground shadow-sm outline-none transition placeholder:text-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:focus:border-primary dark:focus:ring-primary/45"
                  />
                </div>

                {/* Email Field (hidden when user is authenticated) */}
                {authResolved && !user && (
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-semibold text-foreground">
                      {t('contactPage.email')}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t('contactPage.emailPlaceholder')}
                      required
                      className="w-full rounded-xl border border-border/80 bg-background px-4 py-3 text-foreground shadow-sm outline-none transition placeholder:text-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:focus:border-primary dark:focus:ring-primary/45"
                    />
                  </div>
                )}

                {/* Category & Subject */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="category" className="mb-2 block text-sm font-semibold text-foreground">
                      {t('contactPage.category')}
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-border/80 bg-background px-4 py-3 text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:focus:border-primary dark:focus:ring-primary/45"
                    >
                      <option value="General">{t('contactPage.categories.general')}</option>
                      <option value="Account">{t('contactPage.categories.account')}</option>
                      <option value="Application">{t('contactPage.categories.application')}</option>
                      <option value="Document Verification">{t('contactPage.categories.verification')}</option>
                      <option value="Payment">{t('contactPage.categories.payment')}</option>
                      <option value="Other">{t('contactPage.categories.other')}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="subject" className="mb-2 block text-sm font-semibold text-foreground">
                      {t('contactPage.subject')}
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder={t('contactPage.messageSubject')}
                      required
                      className="w-full rounded-xl border border-border/80 bg-background px-4 py-3 text-foreground shadow-sm outline-none transition placeholder:text-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:focus:border-primary dark:focus:ring-primary/45"
                    />
                  </div>
                </div>

                {/* Message Field */}
                <div>
                  <label htmlFor="message" className="mb-2 block text-sm font-semibold text-foreground">
                    {t('contactPage.message')}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={t('contactPage.messageHelp')}
                    rows={7}
                    required
                    className="w-full resize-none rounded-xl border border-border/80 bg-background px-4 py-3 text-foreground shadow-sm outline-none transition placeholder:text-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/30 dark:focus:border-primary dark:focus:ring-primary/45"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? t('contactPage.sending') : t('contactPage.sendMessage')}
                </Button>
              </form>
            </div>
          </div>

          {/* FAQ + Ask */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm md:p-7">
              <h2 className="mb-5 text-2xl font-black text-foreground">{t('contactPage.faqTitle')}</h2>

              <div className="space-y-3">
                {((faqs && faqs.length > 0) ? faqs : fallbackFaqs).map((faq, idx) => (
                  <div key={faq.id ?? idx} className="rounded-xl border border-border/70 bg-background/70 p-4 transition hover:border-primary/45 dark:hover:border-primary/55">
                    <h4 className="text-sm font-bold text-foreground md:text-base">{faq.question}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/65">{faq.answer ?? t('contactPage.noAnswerYet')}</p>
                  </div>
                ))}
              </div>

              {/* Help CTA */}
              <div className="mt-6 rounded-xl border border-primary/25 bg-primary/10 p-5 text-center dark:border-primary/40 dark:bg-primary/20">
                <p className="mb-3 text-sm text-foreground/75">{t('contactPage.noResultHelp')}</p>
                <Button className="w-full rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
                  {t('contactPage.helpCenter')}
                </Button>
              </div>
            </div>

            {/* Ask a Question */}
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm md:p-7">
              <h4 className="mb-3 text-lg font-bold text-foreground">{t('contactPage.askQuestionTitle')}</h4>
              <textarea
                value={askQuestion}
                onChange={(e) => setAskQuestion(e.target.value)}
                placeholder={t('contactPage.askQuestionPlaceholder')}
                className="mb-3 w-full rounded-xl border border-border/80 bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:focus:border-primary dark:focus:ring-primary/45"
              />
              {!user && (
                <>
                  <input
                    value={askName}
                    onChange={(e) => setAskName(e.target.value)}
                    placeholder={t('contactPage.askNamePlaceholder')}
                    className="mb-2 w-full rounded-xl border border-border/80 bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:focus:border-primary dark:focus:ring-primary/45"
                  />
                  <input
                    value={askEmail}
                    onChange={(e) => setAskEmail(e.target.value)}
                    placeholder={t('contactPage.askEmailPlaceholder')}
                    className="mb-3 w-full rounded-xl border border-border/80 bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:focus:border-primary dark:focus:ring-primary/45"
                  />
                </>
              )}
              <div className="flex gap-2">
                <Button
                  disabled={!askQuestion.trim() || askSubmitting}
                  className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={async () => {
                    setAskSubmitting(true)
                    try {
                      await Faqs.ask({ question: askQuestion, asker_name: user?.name ?? askName, asker_email: user?.email ?? askEmail })
                      setAskQuestion('')
                      setAskName('')
                      setAskEmail('')
                      // reload public faqs
                      const list = await Faqs.list() as any
                      setFaqs(list.data ?? list)
                      showNotice('success', t('contactPage.submitQuestionSuccess'))
                    } catch (e) {
                      showNotice('error', t('contactPage.submitQuestionFailed'))
                    } finally { setAskSubmitting(false) }
                  }}
                >
                  {askSubmitting ? t('contactPage.sending') : t('contactPage.askQuestion')}
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => { setAskQuestion(''); setAskName(''); setAskEmail('') }}>{t('contactPage.cancel')}</Button>
              </div>
            </div>
          </div>
        </div>

        {/* My Messages (for logged in users) */}
        {(myMessages.length > 0 || user) && (
          <section className="mt-10 rounded-3xl border border-border/70 bg-card p-6 shadow-sm md:p-8">
            <h3 className="mb-5 text-2xl font-black text-foreground">{t('contactPage.myMessages')}</h3>
            <div className="space-y-4">
              {myMessages.length === 0 && <div className="text-sm text-foreground/60">{t('contactPage.noMessages')}</div>}
              {myMessages.map((m: any) => (
                <div key={m.id} className="rounded-xl border border-border/70 bg-background/70 p-4">
                  {(() => {
                    const messageId = String(m.id)
                    const replyDraft = replyDrafts[messageId] ?? ''
                    const isReplying = openReplyId === messageId
                    const isReplySubmitting = replySubmittingId === messageId

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-foreground">{m.subject}</div>
                          <div className="text-sm text-foreground/60">{m.created_at}</div>
                        </div>
                        <div className="mt-2 whitespace-pre-wrap text-foreground/75">{m.message}</div>
                        {(m.replies ?? []).length > 0 && (
                          <div className="mt-3 space-y-2">
                            {(m.replies ?? []).map((r: any) => (
                              <div key={r.id} className="rounded-lg border border-border bg-card p-3">
                                <div className="text-sm text-foreground/60">{r.sender} • {r.created_at}</div>
                                <div className="mt-1 whitespace-pre-wrap">{r.message}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              className="rounded-lg"
                              onClick={() => {
                                setOpenReplyId((prev) => (prev === messageId ? null : messageId))
                              }}
                            >
                              {t('contactPage.reply')}
                            </Button>
                            <Button
                              variant="outline"
                              className="rounded-lg border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                              onClick={() => handleDeleteMessage(m)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>

                        {isReplying && (
                          <div className="mt-3 rounded-xl border border-border/70 bg-card p-3">
                            <textarea
                              value={replyDraft}
                              onChange={(e) => {
                                const value = e.target.value
                                setReplyDrafts((prev) => ({ ...prev, [messageId]: value }))
                              }}
                              rows={3}
                              placeholder={t('contactPage.replyPlaceholder')}
                              className="w-full resize-none rounded-lg border border-border/80 bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 dark:focus:border-primary dark:focus:ring-primary/45"
                            />
                            <div className="mt-2 flex gap-2">
                              <Button
                                className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                                disabled={!replyDraft.trim() || isReplySubmitting}
                                onClick={() => handleReplySubmit(m)}
                              >
                                {isReplySubmitting ? t('contactPage.sending') : t('contactPage.sendReply')}
                              </Button>
                              <Button
                                variant="outline"
                                className="rounded-lg"
                                onClick={() => {
                                  setReplyDrafts((prev) => ({ ...prev, [messageId]: '' }))
                                  setOpenReplyId(null)
                                }}
                              >
                                {t('contactPage.cancel')}
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {notice && (
        <div className="fixed bottom-5 right-5 z-100 max-w-sm animate-in slide-in-from-bottom-3 fade-in duration-300">
          <div
            className={`rounded-2xl border px-4 py-3 shadow-xl backdrop-blur ${notice.type === 'success'
                ? 'border-primary/30 bg-primary text-primary-foreground'
                : 'border-red-300 bg-red-600 text-white'
              }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-sm font-semibold">
                {notice.type === 'success' ? 'Success' : 'Error'}
              </div>
              <p className="flex-1 text-sm leading-relaxed">{notice.message}</p>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="text-sm opacity-85 transition hover:opacity-100"
                aria-label="Close notification"
              >
                x
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  )
}

export default ContactPage
