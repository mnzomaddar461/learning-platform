'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useToast } from '../components/Toast'
import { useAuthGuard } from '../lib/useAuthGuard'

export default function CoursesPage() {
  useAuthGuard()
  const { addToast } = useToast()
  const [filter, setFilter] = useState('all')
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [coins, setCoins] = useState(0)
  const [enrolledIds, setEnrolledIds] = useState([])
  const [unlocking, setUnlocking] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => {
        setCourses(data.courses || [])
        setLoading(false)
      })

    const saved = localStorage.getItem('user')
    if (saved) {
      const u = JSON.parse(saved)
      setUser(u)

      fetch(`/api/coins?userId=${u.id}`)
        .then(res => res.json())
        .then(data => setCoins(data.coins || 0))

      fetch(`/api/enrollment?userId=${u.id}`)
        .then(res => res.json())
        .then(data => setEnrolledIds(data.enrolledCourseIds || []))
    }
  }, [])

  const handleUnlock = async (course) => {
    if (!user) { window.location.href = '/login'; return }
    if (unlocking) return
    setUnlocking(course.id)
    setMessage(null)

    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, courseId: course.id })
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error })
        addToast(data.error, 'error')
      } else {
        setMessage({ type: 'success', text: data.message })
        setCoins(data.remainingCoins)
        setEnrolledIds([...enrolledIds, course.id])
        addToast(`🔓 "${course.title}" unlock হয়েছে! -${course.coin_unlock_price} 🪙`, 'coin', 4000)
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'নেটওয়ার্ক সমস্যা হয়েছে' })
    } finally {
      setUnlocking(null)
    }
  }

  const filtered = filter === 'all' ? courses
    : filter === 'free' ? courses.filter(c => !c.is_paid)
    : filter === 'paid' ? courses.filter(c => c.is_paid)
    : courses.filter(c => c.level?.toLowerCase() === filter)

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white">লোড হচ্ছে...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-16">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">সব কোর্স</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            বাংলায় প্রোগ্রামিং শিখুন — Beginner থেকে Advanced পর্যন্ত।
          </p>
          {user && (
            <div className="mt-4 inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 px-4 py-2 rounded-full">
              <span className="text-yellow-400 font-bold">🪙 {coins} কয়েন</span>
              <span className="text-gray-500 text-sm">আপনার ব্যালেন্স</span>
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`max-w-7xl mx-auto px-6 mt-4`}>
          <div className={`p-4 rounded-xl border text-sm font-semibold ${
            message.type === 'success'
              ? 'bg-green-900/30 border-green-700/40 text-green-400'
              : 'bg-red-900/30 border-red-700/40 text-red-400'
          }`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
            <button onClick={() => setMessage(null)} className="float-right opacity-60 hover:opacity-100">✕</button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
          {[
            { key: 'all', label: 'সব কোর্স' },
            { key: 'free', label: '🆓 ফ্রি' },
            { key: 'paid', label: '🪙 পেইড' },
            { key: 'beginner', label: 'Beginner' },
            { key: 'intermediate', label: 'Intermediate' },
            { key: 'advanced', label: 'Advanced' },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f.key ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-20">কোনো কোর্স পাওয়া যায়নি</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => {
              const isEnrolled = enrolledIds.includes(course.id)
              const canUnlockWithCoins = course.is_paid && course.coin_unlock_price > 0
              const hasEnoughCoins = coins >= (course.coin_unlock_price || 0)

              return (
                <div key={course.id}
                  className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-purple-600 transition-all duration-300 hover:-translate-y-1 flex flex-col">

                  <div className={`bg-gradient-to-br ${course.color || 'from-purple-600 to-purple-800'} p-6 relative`}>
                    <span className="text-4xl">{course.icon}</span>
                    <span className={`absolute top-4 left-4 text-xs font-bold px-2 py-1 rounded-full ${
                      course.is_paid ? 'bg-yellow-400 text-gray-900' : 'bg-green-400 text-gray-900'
                    }`}>
                      {course.is_paid ? `৳${course.price}` : 'FREE'}
                    </span>
                    {course.badge && (
                      <span className="absolute top-4 right-4 text-xs font-semibold px-2 py-1 rounded-full bg-white/20 text-white">
                        {course.badge}
                      </span>
                    )}
                    {isEnrolled && (
                      <span className="absolute bottom-4 right-4 text-xs font-bold px-2 py-1 rounded-full bg-green-400 text-gray-900">
                        ✓ Enrolled
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {course.level && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          course.level === 'Beginner' ? 'bg-green-900/50 text-green-400' :
                          course.level === 'Intermediate' ? 'bg-orange-900/50 text-orange-400' :
                          'bg-red-900/50 text-red-400'
                        }`}>
                          {course.level}
                        </span>
                      )}
                      {course.duration && <span className="text-gray-500 text-xs">⏱ {course.duration}</span>}
                      <span className="text-gray-500 text-xs">📖 {course.lessons} lessons</span>
                    </div>

                    <h3 className="text-white font-bold text-xl mb-2">{course.title}</h3>
                    <p className="text-gray-400 text-sm mb-4 flex-1">{course.description}</p>

                    {course.topics && course.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {course.topics.map((topic) => (
                          <span key={topic} className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-md">{topic}</span>
                        ))}
                      </div>
                    )}

                    {/* Rewards */}
                    <div className="flex items-center gap-3 mb-4">
                      {course.coin_reward > 0 && (
                        <span className="text-yellow-400 text-xs font-semibold bg-yellow-400/10 px-2 py-1 rounded-full">🪙 +{course.coin_reward} কয়েন</span>
                      )}
                      {course.diamond_reward > 0 && (
                        <span className="text-cyan-400 text-xs font-semibold bg-cyan-400/10 px-2 py-1 rounded-full">💎 +{course.diamond_reward} ডায়মন্ড</span>
                      )}
                    </div>

                    {/* Action Button */}
                    {!course.is_published ? (
                      <button disabled className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-800 text-gray-500 cursor-not-allowed">
                        🔒 শীঘ্রই আসছে
                      </button>
                    ) : isEnrolled ? (
                      <Link href={`/courses/${course.id}`}
                        className="w-full py-3 rounded-xl font-semibold text-sm text-center block transition bg-green-600 hover:bg-green-700 text-white">
                        ✓ শুরু করুন →
                      </Link>
                    ) : !course.is_paid ? (
                      <Link href={`/courses/${course.id}`}
                        className="w-full py-3 rounded-xl font-semibold text-sm text-center block transition bg-purple-600 hover:bg-purple-700 text-white">
                        🎓 ফ্রি শুরু করুন →
                      </Link>
                    ) : canUnlockWithCoins ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleUnlock(course)}
                          disabled={!hasEnoughCoins || unlocking === course.id}
                          className={`w-full py-3 rounded-xl font-semibold text-sm transition ${
                            hasEnoughCoins
                              ? 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'
                              : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-yellow-700/30'
                          }`}>
                          {unlocking === course.id ? '⏳ Unlock হচ্ছে...' :
                           hasEnoughCoins ? `🪙 ${course.coin_unlock_price} Coin দিয়ে Unlock` :
                           `🪙 দরকার ${course.coin_unlock_price} (আপনার ${coins})`}
                        </button>
                        <p className="text-gray-600 text-xs text-center">অথবা ভবিষ্যতে ৳{course.price} এ কিনুন</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-full py-3 rounded-xl font-semibold text-sm text-center bg-gray-800 border border-yellow-600/40 text-yellow-400 cursor-not-allowed">
                          🔒 Mission Complete করলে Free Access পাবেন
                        </div>
                        <p className="text-gray-600 text-xs text-center">অথবা ভবিষ্যতে ৳{course.price} এ কিনুন</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}