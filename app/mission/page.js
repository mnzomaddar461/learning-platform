'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function MissionListPage() {
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/missions')
      .then(res => res.json())
      .then(data => {
        setMissions(data.missions || [])
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white">লোড হচ্ছে...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-16">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">🚀 মিশন জোন</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            চ্যালেঞ্জে অংশ নিন, পুরস্কার জিতুন, নিজেকে যাচাই করুন।
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {missions.length === 0 ? (
          <div className="text-center text-gray-500 py-20">এখনো কোনো মিশন যোগ করা হয়নি</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {missions.map((mission) => {
              const full = mission.registered_count >= mission.max_participants
              return (
                <div key={mission.id}
                  className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-orange-600 transition-all duration-300 hover:-translate-y-1 flex flex-col">

                  <div className={`bg-gradient-to-br ${mission.color || 'from-orange-500 to-red-500'} p-6 relative`}>
                    <span className="text-4xl">{mission.icon || '🚀'}</span>
                    <span className={`absolute top-4 right-4 text-xs font-semibold px-2 py-1 rounded-full ${
                      mission.is_active ? 'bg-green-400 text-gray-900' : 'bg-gray-900/60 text-gray-300'
                    }`}>
                      {mission.is_active ? '🔴 Live' : 'শেষ হয়েছে'}
                    </span>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-white font-bold text-xl mb-2">{mission.title}</h3>
                    <p className="text-gray-400 text-sm mb-4 flex-1">{mission.description}</p>

                    <div className="flex items-center gap-4 mb-3 text-sm">
                      <span className="text-yellow-400 font-semibold">৳{mission.prize_amount}</span>
                      <span className="text-gray-500">👥 {mission.registered_count}/{mission.max_participants}</span>
                    </div>

                    {/* Reward Badge */}
                    <div className="flex items-center gap-3 mb-4">
                      {mission.coin_reward > 0 && (
                        <span className="text-yellow-400 text-xs font-semibold bg-yellow-400/10 px-2 py-1 rounded-full">🪙 +{mission.coin_reward} কয়েন</span>
                      )}
                      {mission.diamond_reward > 0 && (
                        <span className="text-cyan-400 text-xs font-semibold bg-cyan-400/10 px-2 py-1 rounded-full">💎 +{mission.diamond_reward} ডায়মন্ড</span>
                      )}
                    </div>

                    {!mission.is_active ? (
                      <button disabled className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-800 text-gray-500 cursor-not-allowed">🔒 মিশন শেষ</button>
                    ) : full ? (
                      <button disabled className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-800 text-gray-500 cursor-not-allowed">আসন পূর্ণ</button>
                    ) : (
                      <Link href={`/mission/${mission.id}`}
                        className="w-full py-3 rounded-xl font-semibold text-sm text-center block transition bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white">
                        বিস্তারিত দেখুন →
                      </Link>
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