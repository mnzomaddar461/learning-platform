'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
export default function Footer() {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null

  return (
    <footer className="bg-gray-950 border-t border-gray-800 px-6 py-16">
      <div className="max-w-7xl mx-auto">

        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl"></span>
              <span className="text-white font-bold text-xl">LeapBangladesh</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              বাংলাদেশের সেরা প্রোগ্রামিং শেখার প্ল্যাটফর্ম। গল্পভিত্তিক কোর্স,
              কোড ল্যাব ও মিশনের মাধ্যমে শিখুন।
            </p>
            <div className="flex items-center gap-3">
              {['f', 'in', 'yt', 'dc'].map((s) => (
                <a key={s} href="#" className="w-9 h-9 bg-gray-800 hover:bg-purple-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition text-sm">
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Courses */}
          <div>
            <h4 className="text-white font-semibold mb-4">কোর্সসমূহ</h4>
            <ul className="space-y-3">
              {['Structured Programming', 'C Programming Basics', 'Data Structures', 'Python Basics'].map((item) => (
                <li key={item}>
                  <Link href="/courses" className="text-gray-500 hover:text-purple-400 text-sm transition">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white font-semibold mb-4">প্ল্যাটফর্ম</h4>
            <ul className="space-y-3">
              {[['কোড ল্যাব', '/practice'], ['মিশন জোন', '/mission'], ['লিডারবোর্ড', '/'], ['সার্টিফিকেট', '/'], ['কমিউনিটি', '/']].map(([item, href]) => (
                <li key={item}>
                  <Link href={href} className="text-gray-500 hover:text-purple-400 text-sm transition">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">কোম্পানি</h4>
            <ul className="space-y-3">
              {['আমাদের সম্পর্কে', 'যোগাযোগ', 'ক্যারিয়ার', 'প্রাইভেসি পলিসি', 'Terms of Service'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-500 hover:text-purple-400 text-sm transition">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-600 text-sm">
            © ২০২৫ CodeQuest BD। সর্বস্বত্ব সংরক্ষিত। 🇧🇩 Made with ❤️ in Bangladesh
          </p>
        </div>

      </div>
    </footer>
  )
}