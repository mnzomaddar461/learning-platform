'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function CertificateContent() {
  const searchParams = useSearchParams()
  const courseTitle = searchParams.get('course') || ''
  const courseId = searchParams.get('id') || ''

  const [user, setUser] = useState(null)
  const [course, setCourse] = useState(null)
  const [completedAt, setCompletedAt] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('user')
    if (!saved) {
      window.location.href = '/login'
      return
    }
    const u = JSON.parse(saved)
    setUser(u)

    fetch('/api/courses')
      .then(res => res.json())
      .then(data => {
        const found = (data.courses || []).find(c => c.id === courseId)
        setCourse(found || null)
      })

    fetch(`/api/certificates?userId=${u.id}`)
      .then(res => res.json())
      .then(data => {
        const cert = (data.certificates || []).find(c => c.course_id === courseId)
        if (cert) setCompletedAt(cert.completed_at)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [courseId])

  const handlePrint = () => window.print()

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white text-xl">লোড হচ্ছে...</div>
    </div>
  )

  const displayDate = completedAt
    ? new Date(completedAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })

  const certId = `LB-${courseId?.slice(0, 6).toUpperCase()}-${user?.id?.slice(0, 6).toUpperCase()}`

  return (
    <div className="min-h-screen py-16 px-6 flex items-center justify-center" style={{ background: '#05070d' }}>
      <style jsx global>{`
        .cert-gradient-text {
          background: linear-gradient(90deg, #22d3ee, #a78bfa, #22d3ee);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: #a78bfa;
        }
        @media print {
          .cert-gradient-text {
            -webkit-text-fill-color: #a78bfa !important;
            color: #a78bfa !important;
            background: none !important;
          }
          @page {
            size: landscape;
            margin: 0;
          }
          html, body {
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          body * { visibility: hidden; }
          #cert-printable, #cert-printable * { visibility: visible; }
          #cert-printable {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            page-break-after: avoid;
            page-break-before: avoid;
          }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      <div className="w-full max-w-5xl">

        {/* Actions */}
        <div className="flex items-center justify-between mb-8 print:hidden">
          <Link href="/profile" className="text-slate-400 hover:text-white text-sm font-medium transition flex items-center gap-1">
            ← প্রোফাইলে ফিরুন
          </Link>
          <button onClick={handlePrint}
            className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-cyan-900/30 flex items-center gap-2">
            ⬇ ডাউনলোড / প্রিন্ট করুন
          </button>
        </div>

        {/* Certificate */}
        <div id="cert-printable"
          className="relative overflow-hidden rounded-3xl"
          style={{
            background: '#0b0e17',
            aspectRatio: '1.62 / 1',
            boxShadow: '0 50px 100px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)',
          }}>

          {/* Gradient border glow */}
          <div className="absolute inset-0 rounded-3xl p-[1.5px]" style={{ background: 'linear-gradient(135deg, #22d3ee, #7c3aed, #22d3ee)' }}>
            <div className="w-full h-full rounded-3xl" style={{ background: '#0b0e17' }} />
          </div>

          {/* Dot grid background (code-editor vibe) */}
          <div className="absolute inset-0 opacity-[0.35]" style={{
            backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.25) 1px, transparent 1px)',
            backgroundSize: '22px 22px'
          }} />

          {/* Glow blobs */}
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.18), transparent 70%)' }} />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.2), transparent 70%)' }} />

          {/* Corner brackets — code editor style */}
          <svg className="absolute top-8 left-8 w-8 h-8 opacity-70" viewBox="0 0 32 32" fill="none">
            <path d="M2 12 V4 H10" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <svg className="absolute top-8 right-8 w-8 h-8 opacity-70" viewBox="0 0 32 32" fill="none">
            <path d="M30 12 V4 H22" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <svg className="absolute bottom-8 left-8 w-8 h-8 opacity-70" viewBox="0 0 32 32" fill="none">
            <path d="M2 20 V28 H10" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <svg className="absolute bottom-8 right-8 w-8 h-8 opacity-70" viewBox="0 0 32 32" fill="none">
            <path d="M30 20 V28 H22" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
          </svg>

          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-between px-10 md:px-20 py-10 md:py-14 text-center">

            {/* Top: brand */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8"
                style={{ borderColor: 'rgba(34,211,238,0.3)', background: 'rgba(34,211,238,0.06)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-cyan-300 text-[11px] font-mono tracking-[0.2em] uppercase">LeapBangladesh</span>
              </div>

              <p className="font-mono text-xs md:text-sm tracking-[0.3em] uppercase mb-2" style={{ color: '#64748b' }}>
                {'<Certificate of Completion />'}
              </p>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-6 cert-gradient-text">
                Achievement Unlocked
              </h1>

              <p className="text-slate-400 text-xs md:text-sm mb-2">This certifies that</p>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-3 px-4 break-words">
                {user?.name || 'Student'}
              </h2>
              <p className="text-slate-400 text-xs md:text-sm mb-1">has successfully completed</p>
              <p className="text-lg md:text-2xl font-bold mb-1 px-4" style={{ color: '#22d3ee' }}>
                {course?.icon} {course?.title || courseTitle}
              </p>
              {course?.level && (
                <p className="text-slate-500 text-xs font-mono">
                  {course.level.toUpperCase()} · {course.duration}
                </p>
              )}
            </div>

            {/* Bottom: meta row */}
            <div className="w-full">
              <div className="w-full h-px mb-6" style={{ background: 'linear-gradient(90deg, transparent, rgba(148,163,184,0.3), transparent)' }} />

              <div className="grid grid-cols-3 items-center gap-4">
                <div className="text-left">
                  <p className="text-slate-500 text-[10px] font-mono uppercase tracking-wider mb-1">Issued</p>
                  <p className="text-slate-200 text-sm font-semibold">{displayDate}</p>
                </div>

                {/* Certificate footer icon */}
                <div className="flex justify-center">
                  <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center rotate-45"
                    style={{ background: 'linear-gradient(135deg, #22d3ee, #7c3aed)', boxShadow: '0 8px 24px -4px rgba(124,58,237,0.5)' }}>
                    <div className="flex items-center gap-0.5 -rotate-45">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L14.5 8.5L21 9.5L16.5 14L17.5 20.5L12 17.5L6.5 20.5L7.5 14L3 9.5L9.5 8.5L12 2Z" fill="white" opacity="0.8" />
                      </svg>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L14.5 8.5L21 9.5L16.5 14L17.5 20.5L12 17.5L6.5 20.5L7.5 14L3 9.5L9.5 8.5L12 2Z" fill="white" />
                      </svg>
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L14.5 8.5L21 9.5L16.5 14L17.5 20.5L12 17.5L6.5 20.5L7.5 14L3 9.5L9.5 8.5L12 2Z" fill="white" opacity="0.8" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-slate-500 text-[10px] font-mono uppercase tracking-wider mb-1">Certificate ID</p>
                  <p className="text-slate-200 text-sm font-mono font-semibold">{certId}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6 print:hidden max-w-md mx-auto leading-relaxed">
          ডাউনলোড করতে উপরের বাটনে ক্লিক করুন, তারপর প্রিন্ট ডায়ালগে <strong className="text-slate-300">"More settings"</strong> খুলে <strong className="text-slate-300">"Background graphics"</strong> অপশনটি অবশ্যই চালু (✓) করে দিন — নাহলে রঙ ও ডিজাইন ছাড়া সাদা কপি ডাউনলোড হবে।
        </p>
      </div>
    </div>
  )
}

export default function CertificatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">লোড হচ্ছে...</div>
      </div>
    }>
      <CertificateContent />
    </Suspense>
  )
}