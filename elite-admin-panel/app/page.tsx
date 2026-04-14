import { redirect } from 'next/navigation'

export default function Page() {
  // Redirect root to the login page so the login screen is the first page shown
  redirect('/Login')
}
