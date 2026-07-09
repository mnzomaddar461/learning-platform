'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Mission() {
  const [mission, setMission] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    fetch('/api/missions')
      .then(res => res.json())
      .then(data => {
        const active = (data.missions || []).find((m: any) => m.is_active)
        setMission(active || data.missions?.[0] || null)
      })
  }, [])

  useEffect(() => {
    if (!mission?.end_date) return
    const target = new Date(mission.end_date)
    const timer = setInterval(() => {
      const now = new Date()
      const diff = target.getTime() - now.getTime()
      if (diff <= 0) { clearInterval(timer); return }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [mission])

  if (!mission) return null

  return (
    <section className="bg-gray-950 py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-900/40 border border-orange-700/50 text-orange-300 px-4 py-2 rounded-full text-sm mb-6">
            <span className="animate-pulse">🔴</span>
            <span>{mission.is_active ? 'Live — রেজিস্ট্রেশন চলছে' : 'বিশেষ ইভেন্ট'}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
              {mission.title}
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">{mission.description}</p>
        </div>

        {mission.end_date && (
          <div className="grid grid-cols-4 gap-4 max-w-xl mx-auto mb-12">
            {[
              { value: timeLeft.days, label: 'দিন' },
              { value: timeLeft.hours, label: 'ঘণ্টা' },
              { value: timeLeft.minutes, label: 'মিনিট' },
              { value: timeLeft.seconds, label: 'সেকেন্ড' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-900 border border-gray-700 rounded-2xl p-4 text-center">
                <div className="text-3xl md:text-4xl font-bold text-white font-mono">
                  {String(item.value).padStart(2, '0')}
                </div>
                <div className="text-gray-500 text-sm mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: '🏆', value: `৳${mission.prize_amount?.toLocaleString() || 0}`, label: 'মোট পুরস্কার' },
            { icon: '👥', value: `${mission.max_participants} জন`, label: 'সর্বোচ্চ অংশগ্রহণকারী' },
            { icon: '✅', value: `${mission.registered_count || 0} জন`, label: 'নিবন্ধিত' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
              <div className="text-3xl mb-3">{s.icon}</div>
              <div className="text-white font-bold text-xl mb-1">{s.value}</div>
              <div className="text-gray-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        {mission.coin_reward > 0 || mission.diamond_reward > 0 ? (
          <div className="flex justify-center gap-4 mb-8">
            {mission.coin_reward > 0 && (
              <span className="bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-semibold">
                🪙 রেজিস্ট্রেশনে +{mission.coin_reward} কয়েন
              </span>
            )}
            {mission.diamond_reward > 0 && (
              <span className="bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 px-4 py-2 rounded-full text-sm font-semibold">
                💎 +{mission.diamond_reward} ডায়মন্ড
              </span>
            )}
          </div>
        ) : null}

        <div className="text-center">
          <Link href={`/mission/${mission.id}`}>
            <button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-10 py-4 rounded-xl text-lg font-bold transition shadow-lg shadow-orange-900/30">
              {mission.is_active ? 'এখনই রেজিস্ট্রেশন করুন' : 'বিস্তারিত দেখুন →'}
            </button>
          </Link>
          <p className="text-gray-500 text-sm mt-4">নিবন্ধন সম্পূর্ণ বিনামূল্যে · সীমিত আসন</p>
        </div>
      </div>
    </section>
  )
}