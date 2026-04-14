import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'

const seekerSteps = [
  'Create your account and complete your profile details.',
  'Upload required documents (passport, certificates, and supporting files).',
  'Browse verified jobs and submit applications.',
  'Track your application progress from your dashboard.',
  'Attend interview and complete pre-departure requirements once selected.',
]

const partnerSteps = [
  'Register your foreign agency account and submit company details.',
  'Upload and verify business license for approval.',
  'Post job requests with full requirements and vacancy details.',
  'Review shortlisted candidates and request interviews.',
  'Finalize placements and manage ongoing hiring communication.',
]

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <section className="relative isolate overflow-hidden border-b border-border px-4 py-14">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-primary/15 via-background to-primary/20" />
        <div className="max-w-6xl mx-auto">
          <p className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Process Guide
          </p>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold text-foreground">How It Works</h1>
          <p className="mt-4 max-w-3xl text-lg text-foreground/70">
            Follow the right path for your role. Job seekers and partner agencies have separate workflows below.
          </p>
        </div>
      </section>

      <section className="flex-1 max-w-6xl mx-auto w-full px-4 py-12 grid gap-6 md:grid-cols-2">
        <article className="rounded-3xl border border-border/80 bg-card/90 p-7 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground">Path For Job Seekers</h2>
          <ol className="mt-5 space-y-3 text-foreground/80">
            {seekerSteps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/RegisterMultiStep">
              <Button className="bg-primary text-primary-foreground">Start As Seeker</Button>
            </Link>
            <Link href="/Jobs">
              <Button variant="outline">Browse Jobs</Button>
            </Link>
          </div>
        </article>

        <article className="rounded-3xl border border-border/80 bg-card/90 p-7 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground">Path For Partners</h2>
          <ol className="mt-5 space-y-3 text-foreground/80">
            {partnerSteps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/RegisterPartner">
              <Button className="bg-primary text-primary-foreground">Start As Partner</Button>
            </Link>
            <Link href="/Partner">
              <Button variant="outline">Partner Dashboard</Button>
            </Link>
          </div>
        </article>
      </section>

      <Footer />
    </main>
  )
}
