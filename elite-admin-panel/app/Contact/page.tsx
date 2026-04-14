'use client'

import React, { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'General'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulated API call
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '', category: 'General' })
      setTimeout(() => setSubmitted(false), 5000)
    }, 1500)
  }

  const contactMethods = [
    {
      icon: '📧',
      title: 'Email',
      description: 'Send us an email and we\'ll respond within 24 hours',
      value: 'support@Elite.com'
    },
    {
      icon: '💬',
      title: 'Live Chat',
      description: 'Chat with our team in real-time',
      value: 'Available 9am - 5pm EAT'
    },
    {
      icon: '📞',
      title: 'Phone',
      description: 'Call our support team',
      value: '+251 1 234 5678'
    },
    {
      icon: '📍',
      title: 'Office',
      description: 'Visit us in person',
      value: 'Addis Ababa, Ethiopia'
    }
  ]

  const faqs = [
    {
      q: 'How do I create an account?',
      a: 'Click the Sign Up button and follow the multi-step registration process. You\'ll need a valid email and basic information.'
    },
    {
      q: 'What documents do I need to verify?',
      a: 'You\'ll need to upload a passport, CV, and relevant certifications. Additional documents may be required for specific jobs.'
    },
    {
      q: 'How long does verification take?',
      a: 'Document verification typically takes 24-48 hours. You\'ll receive notifications when each document is verified.'
    },
    {
      q: 'Can I apply for multiple jobs?',
      a: 'Yes, you can apply for as many jobs as you\'d like. There\'s no limit on applications.'
    }
  ]

  return (
    <main className="min-h-screen flex flex-col bg-background">

      {/* Page Header */}
      <section className="bg-linear-to-br from-primary/10 to-secondary/10 border-b border-border px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Get in Touch</h1>
          <p className="text-lg text-foreground/60 max-w-2xl">
            Have questions? We're here to help. Contact our support team anytime.
          </p>
        </div>
      </section>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
        {/* Contact Methods */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {contactMethods.map((method, idx) => (
            <div key={idx} className="bg-card border border-border rounded-lg p-6 text-center hover:shadow-md transition">
              <div className="text-4xl mb-4">{method.icon}</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{method.title}</h3>
              <p className="text-sm text-foreground/60 mb-3">{method.description}</p>
              <p className="font-semibold text-primary">{method.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold text-foreground mb-8">Send us a Message</h2>

            {submitted && (
              <div className="mb-6 p-4 bg-primary/10 dark:bg-primary/20 border border-primary/25 dark:border-primary/35 rounded-lg">
                <p className="text-primary dark:text-primary-foreground font-semibold">✓ Message sent successfully!</p>
                <p className="text-sm text-primary/80 dark:text-primary-foreground/80">We'll get back to you as soon as possible.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
                />
              </div>

              {/* Email Field */}
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
                  required
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
                />
              </div>

              {/* Category & Subject */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-semibold text-foreground mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
                  >
                    <option>General</option>
                    <option>Account</option>
                    <option>Application</option>
                    <option>Document Verification</option>
                    <option>Payment</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-foreground mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Message subject"
                    required
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none"
                  />
                </div>
              </div>

              {/* Message Field */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-foreground mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us how we can help..."
                  rows={6}
                  required
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent transition outline-none resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-8">Frequently Asked Questions</h2>

            <div className="space-y-6">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-card border border-border rounded-lg p-5 hover:border-primary/30 transition">
                  <h4 className="font-semibold text-foreground mb-2 text-sm">{faq.q}</h4>
                  <p className="text-foreground/60 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>

            {/* Help CTA */}
            <div className="mt-8 bg-primary/10 border border-primary/20 rounded-lg p-6 text-center">
              <p className="text-foreground/70 text-sm mb-4">Didn't find what you're looking for?</p>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                View Full Help Center
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

export default ContactPage

