'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthGuard } from '../lib/useAuthGuard'

export default function Dashboard() {
  useAuthGuard()
  const [user, setUser] = useState(null)
  const [coins, setCoins] = useState(0)
  const [diamonds, setDiamonds] = useState(0)
  const [courses, setCourses] = useState([])
  const [missions, setMissions] = useState([])
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [loading, setLoading] = useState(true)

useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (!savedUser) { window.location.href = '/login'; return }
    const u = JSON.parse(savedUser)
    setUser(u)

    // Coins & Diamonds
    fetch(`/api/coins?userId=${u.id}`)
      .then(res => res.json())
      .then(data => {
        setCoins(data.coins || 0)
        setDiamonds(data.diamonds || 0)
      })

    // Courses
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => setCourses(data.courses || []))

    // Missions
    fetch('/api/missions')
      .then(res => res.json())
      .then(data => setMissions(data.missions || []))

    // Progress & enrolled courses
    fetch(`/api/progress?userId=${u.id}`)
      .then(res => res.json())
      .then(data => {
        setEnrolledCourses(data.enrollments || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !user) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white text-xl">লোড হচ্ছে...</div>
    </div>
  )

  const activeMissions = missions.filter(m => m.is_active)
  const freeCourses = courses.filter(c => !c.is_paid)

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Welcome Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              স্বাগতম, {user.name}! 👋
            </h1>
            <p className="text-gray-400">আজকে কী শিখবেন?</p>
          </div>
          <Link href="/profile"
            className="flex items-center gap-3 bg-gray-900 border border-gray-800 hover:border-purple-600 px-4 py-3 rounded-xl transition">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-white text-sm font-semibold">{user.name}</div>
              <div className="text-gray-400 text-xs">প্রোফাইল দেখুন →</div>
            </div>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            {
              icon: '🪙', label: 'কয়েন', value: coins,
              color: 'from-yellow-900/40 to-yellow-800/20', border: 'border-yellow-700/40', textColor: 'text-yellow-400'
            },
            {
              icon: '💎', label: 'ডায়মন্ড', value: diamonds,
              color: 'from-cyan-900/40 to-cyan-800/20', border: 'border-cyan-700/40', textColor: 'text-cyan-400'
            },
            {
              icon: '📚', label: 'কোর্স', value: courses.length,
              color: 'from-purple-900/40 to-purple-800/20', border: 'border-purple-700/40', textColor: 'text-purple-400'
            },
            {
              icon: '🚀', label: 'মিশন', value: activeMissions.length,
              color: 'from-orange-900/40 to-orange-800/20', border: 'border-orange-700/40', textColor: 'text-orange-400'
            },
          ].map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-5`}>
              <div className="text-3xl mb-3">{stat.icon}</div>
              <div className={`text-3xl font-black ${stat.textColor} mb-1`}>{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Left: Quick Actions */}
          <div className="lg:col-span-2 space-y-6">

            {/* Active Mission Banner */}
            {activeMissions.length > 0 && (
              <div className="bg-gradient-to-r from-orange-900/40 via-red-900/30 to-pink-900/20 border border-orange-700/40 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="animate-pulse text-red-400">🔴</span>
                      <span className="text-orange-300 text-xs font-semibold uppercase tracking-wider">Live Mission</span>
                    </div>
                    <h3 className="text-white font-bold text-xl mb-1">{activeMissions[0].title}</h3>
                    <p className="text-gray-400 text-sm mb-3">{activeMissions[0].description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-yellow-400 font-semibold">🏆 ৳{activeMissions[0].prize_amount}</span>
                      {activeMissions[0].coin_reward > 0 && (
                        <span className="text-yellow-400">🪙 +{activeMissions[0].coin_reward} কয়েন</span>
                      )}
                      {activeMissions[0].diamond_reward > 0 && (
                        <span className="text-cyan-400">💎 +{activeMissions[0].diamond_reward} ডায়মন্ড</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/mission/${activeMissions[0].id}`}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white px-5 py-3 rounded-xl font-bold text-sm transition whitespace-nowrap">
                    যোগ দিন →
                  </Link>
                </div>
              </div>
            )}

            {/* Available Courses */}
            {/* Available/Enrolled Courses */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-bold text-lg">
                  {enrolledCourses.length > 0 ? '📚 আমার কোর্স' : '📚 কোর্সসমূহ'}
                </h3>
                <Link href="/courses" className="text-purple-400 hover:text-purple-300 text-sm transition">
                  সব দেখুন →
                </Link>
              </div>

              {enrolledCourses.length > 0 ? (
                // Enrolled courses with progress
                <div className="space-y-4">
                  {enrolledCourses.slice(0, 4).map((enrollment) => (
                    <Link key={enrollment.course_id} href={`/courses/${enrollment.course_id}`}
                      className="flex items-center gap-4 p-4 bg-gray-800/50 border border-gray-700/50 hover:border-purple-600/50 rounded-xl transition block">
                      <div className={`w-12 h-12 bg-gradient-to-br ${enrollment.color} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
                        {enrollment.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm mb-1 truncate">{enrollment.title}</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full transition-all"
                              style={{ width: `${enrollment.progress_percent}%` }}
                            />
                          </div>
                          <span className="text-gray-400 text-xs flex-shrink-0">
                            {enrollment.progress_percent}%
                          </span>
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          {enrollment.progress}/{enrollment.total_lessons} lesson সম্পন্ন
                        </div>
                      </div>
                      {enrollment.progress_percent === 100 ? (
                        <span className="text-green-400 text-xs font-bold flex-shrink-0">✓ সম্পন্ন</span>
                      ) : (
                        <span className="text-purple-400 text-xs flex-shrink-0">চালু রাখুন →</span>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                // No enrolled courses — show available courses
                courses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📭</div>
                    <p>কোনো কোর্স পাওয়া যায়নি</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {courses.slice(0, 3).map((course) => (
                      <div key={course.id}
                        className="flex items-center gap-4 p-4 bg-gray-800/50 border border-gray-700/50 hover:border-purple-600/50 rounded-xl transition">
                        <div className={`w-12 h-12 bg-gradient-to-br ${course.color || 'from-purple-600 to-purple-800'} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
                          {course.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-semibold text-sm truncate">{course.title}</div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-gray-500 text-xs">📖 {course.lessons} lessons</span>
                            {course.coin_reward > 0 && (
                              <span className="text-yellow-400 text-xs">🪙 +{course.coin_reward}</span>
                            )}
                          </div>
                        </div>
                        <Link href={`/courses/${course.id}`}
                          className="text-xs font-semibold px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition whitespace-nowrap">
                          শুরু করুন
                        </Link>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">

            {/* Coin & Diamond Balance */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-white font-bold text-base mb-4">💰 আমার ব্যালেন্স</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🪙</span>
                    <span className="text-gray-300 text-sm">কয়েন</span>
                  </div>
                  <span className="text-yellow-400 font-black text-xl">{coins}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-cyan-400/10 border border-cyan-400/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💎</span>
                    <span className="text-gray-300 text-sm">ডায়মন্ড</span>
                  </div>
                  <span className="text-cyan-400 font-black text-xl">{diamonds}</span>
                </div>
              </div>
              <p className="text-gray-600 text-xs mt-3 text-center">কোর্স ও মিশন complete করে আরও অর্জন করুন</p>
            </div>

            {/* How to earn */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-white font-bold text-base mb-4">🎁 কীভাবে পাবেন</h3>
              <div className="space-y-3">
                {[
                  { icon: '📚', label: 'কোর্স শেষ করুন', reward: '🪙 কয়েন', color: 'text-yellow-400' },
                  { icon: '🚀', label: 'মিশনে রেজিস্ট্রেশন', reward: '🪙 কয়েন', color: 'text-yellow-400' },
                  { icon: '💎', label: 'বিশেষ কোর্স', reward: '💎 ডায়মন্ড', color: 'text-cyan-400' },
                  { icon: '👑', label: 'Admin পুরস্কার', reward: '🎁 যেকোনো', color: 'text-purple-400' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>{item.icon}</span>
                      <span className="text-gray-400">{item.label}</span>
                    </div>
                    <span className={`${item.color} text-xs font-semibold`}>{item.reward}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-white font-bold text-base mb-4">⚡ Quick Links</h3>
              <div className="space-y-2">
                {[
                  { href: '/courses', label: '📚 সব কোর্স', color: 'hover:border-purple-600/50' },
                  { href: '/mission', label: '🚀 মিশন জোন', color: 'hover:border-orange-600/50' },
                  { href: '/practice', label: '💻 কোড প্র্যাকটিস', color: 'hover:border-blue-600/50' },
                  { href: '/profile', label: '👤 আমার প্রোফাইল', color: 'hover:border-pink-600/50' },
                ].map((link, i) => (
                  <Link key={i} href={link.href}
                    className={`flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700/50 ${link.color} rounded-xl text-sm text-gray-300 hover:text-white transition`}>
                    {link.label}
                    <span className="text-gray-600">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}