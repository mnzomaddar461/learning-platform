import type { Metadata } from 'next'
import './globals.css'
import GlobalNavbar from './components/GlobalNavbar'
import Footer from './components/Footer'
import { ToastProvider } from './components/Toast'

export const metadata: Metadata = {
  title: 'LeapBangladesh',
  description: 'বাংলাদেশের সেরা প্রোগ্রামিং শেখার প্ল্যাটফর্ম',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="bn" className="h-full">
      <body className="h-full bg-gray-950" suppressHydrationWarning>
        <ToastProvider>
          <GlobalNavbar />
          <div className="pt-16">
            {children}
          </div>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  )
}