'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export default function Certificate() {
  const [user, setUser] = useState(null)
  const [course, setCourse] = useState(null)
  const certificateRef = useRef(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) setUser(JSON.parse(savedUser))

    // URL থেকে course info নিন
    const params = new URLSearchParams(window.location.search)
    const courseName = params.get('course') || 'Structured Programming'
    const courseId = params.get('id') || '1'
    setCourse({ name: courseName, id: courseId })
  }, [])

  const downloadCertificate = () => {
    window.print()
  }

  const today = new Date().toLocaleDateString('bn-BD', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  if (!user || !course) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white">লোড হচ্ছে...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .certificate-wrap { box-shadow: none !important; }
        }
      `}</style>

      {/* Navbar */}
      {/* <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between no-print">
        <Link href="/" className="text-white font-bold text-xl">LeapBangladesh</Link>
        <div className="flex items-center gap-3">
          <Link href="/courses" className="text-gray-400 hover:text-white text-sm transition">← কোর্সে ফিরুন</Link>
          <button
            onClick={downloadCertificate}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
          >
            ⬇️ Download PDF
          </button>
        </div>
      </nav> */}

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Certificate */}
        <div ref={certificateRef} className="certificate-wrap bg-white rounded-3xl overflow-hidden shadow-2xl">

          {/* Top border decoration */}
          <div className="h-3 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400" />

          <div className="p-16 text-center relative">

            {/* Background decoration */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-10 left-10 w-40 h-40 border-4 border-purple-600 rounded-full" />
              <div className="absolute bottom-10 right-10 w-32 h-32 border-4 border-orange-400 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-gray-400 rounded-full" />
            </div>

            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <span className="text-4xl">🚀</span>
              <span className="text-3xl font-black text-gray-800">CodeQuest BD</span>
            </div>

            {/* Certificate title */}
            <div className="mb-8">
              <p className="text-gray-500 text-lg tracking-widest uppercase font-medium mb-2">
                Certificate of Completion
              </p>
              <div className="w-32 h-1 bg-gradient-to-r from-purple-600 to-pink-500 mx-auto rounded-full" />
            </div>

            {/* This certifies */}
            <p className="text-gray-500 text-lg mb-4">এই সনদপত্র প্রদান করা হচ্ছে</p>

            {/* Name */}
            <h1 className="text-5xl font-black text-gray-900 mb-6 pb-4 border-b-2 border-gray-200 inline-block px-8">
              {user.name}
            </h1>

            {/* Completion text */}
            <p className="text-gray-600 text-xl mt-6 mb-4">
              সফলভাবে সম্পন্ন করেছেন
            </p>

            {/* Course name */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl px-8 py-5 inline-block mb-8">
              <h2 className="text-3xl font-black text-purple-700">{course.name}</h2>
            </div>

            {/* Description */}
            <p className="text-gray-500 text-base max-w-2xl mx-auto mb-10 leading-relaxed">
              এই কোর্সে অংশগ্রহণ করে প্রোগ্রামিং এর মূল ধারণা, সমস্যা সমাধান এবং
              বাস্তব প্রয়োগ সম্পর্কে দক্ষতা অর্জন করেছেন।
            </p>

            {/* Date + Signature row */}
            <div className="flex items-end justify-between px-8 mt-8">
              <div className="text-left">
                <div className="text-gray-400 text-sm mb-1">তারিখ</div>
                <div className="text-gray-700 font-semibold">{today}</div>
                <div className="w-32 h-px bg-gray-300 mt-2" />
              </div>

              {/* Badge */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
                  <span className="text-white text-4xl">🏆</span>
                </div>
                <div className="text-xs text-gray-400">Verified</div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-gray-800 mb-1">CodeQuest BD</div>
                <div className="text-gray-500 text-sm">Platform Director</div>
                <div className="w-32 h-px bg-gray-300 mt-2 ml-auto" />
              </div>
            </div>

            {/* Certificate ID */}
            <div className="mt-10 pt-6 border-t border-gray-100">
              <p className="text-gray-400 text-xs">
                Certificate ID: CQ-{course.id}-{user.id?.toString().slice(0, 8).toUpperCase() || 'XXXXXXXX'}-2025
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Verify at: codequest.bd/verify
              </p>
            </div>
          </div>

          {/* Bottom border */}
          <div className="h-3 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600" />
        </div>

        {/* Share buttons */}
        <div className="mt-8 flex items-center justify-center gap-4 no-print">
          <p className="text-gray-400 text-sm">শেয়ার করুন:</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">
            LinkedIn এ শেয়ার
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition">
            Facebook এ শেয়ার
          </button>
          <button
            onClick={downloadCertificate}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            ⬇️ PDF Download
          </button>
        </div>
      </div>
    </div>
  )
}