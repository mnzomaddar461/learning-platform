'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function LeaderboardPage() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('coins')
  const [currentUser, setCurrentUser] = useState(null)
  const [userRank, setUserRank] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('user')
    if (saved) setCurrentUser(JSON.parse(saved))

    Promise.all([
      fetch('/api/admin/users').then(r => r.json()),
      fetch('/api/leaderboard').then(r => r.json()),
    ]).then(([usersData, coinsData]) => {
      const users = usersData.users || []
      const coinsMap = {}
      ;(coinsData.leaderboard || []).forEach(u => {
        coinsMap[u.user_id] = { coins: u.coins, diamonds: u.diamonds }
      })

      const enriched = users.map(u => ({
        ...u,
        coins: coinsMap[u.id]?.coins || 0,
        diamonds: coinsMap[u.id]?.diamonds || 0,
      }))

      setPlayers(enriched)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const sorted = [...players].sort((a, b) => {
    if (filter === 'coins') return (b.coins || 0) - (a.coins || 0)
    if (filter === 'diamonds') return (b.diamonds || 0) - (a.diamonds || 0)
    return (b.points || 0) - (a.points || 0)
  })

  useEffect(() => {
    if (currentUser && sorted.length > 0) {
      const idx = sorted.findIndex(p => p.id === currentUser.id)
      setUserRank(idx >= 0 ? idx + 1 : null)
    }
  }, [sorted.length, filter])

  const getValue = (player) => {
    if (filter === 'coins') return `🪙 ${(player.coins || 0).toLocaleString()}`
    if (filter === 'diamonds') return `💎 ${(player.diamonds || 0).toLocaleString()}`
    return `⭐ ${(player.points || 0).toLocaleString()}`
  }

  const top3 = sorted.slice(0, 3)
  const rest = sorted.slice(3)

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white text-xl">লোড হচ্ছে...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-900/40 border border-yellow-700/50 text-yellow-300 px-4 py-2 rounded-full text-sm mb-6">
            <span>🏆</span><span>লিডারবোর্ড</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">সেরাদের তালিকা</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            কোর্স complete করো, মিশনে অংশ নাও, coin/diamond অর্জন করো — শীর্ষে উঠো।
          </p>
          {userRank && (
            <div className="mt-4 inline-flex items-center gap-2 bg-purple-900/40 border border-purple-700/50 text-purple-300 px-4 py-2 rounded-full text-sm">
              তোমার অবস্থান: <span className="font-bold text-white">#{userRank}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Filter */}
        <div className="flex gap-2 mb-10 justify-center">
          {[
            { key: 'coins', label: '🪙 কয়েন' },
            { key: 'diamonds', label: '💎 ডায়মন্ড' },
            { key: 'points', label: '⭐ পয়েন্ট' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${
                filter === f.key ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {sorted.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <div className="text-5xl mb-4">📭</div>
            <p>এখনো কোনো শিক্ষার্থী নেই</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {top3.length >= 3 && (
              <div className="flex items-end justify-center gap-4 mb-12">
                {/* 2nd */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-black text-2xl mb-2 border-4 border-gray-700">
                    {top3[1]?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-white font-semibold text-sm mb-1 max-w-20 truncate text-center">{top3[1]?.name}</div>
                  <div className="text-gray-400 text-xs mb-2">{getValue(top3[1])}</div>
                  <div className="bg-gray-700 text-white text-center py-4 px-6 rounded-t-xl" style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="text-3xl">🥈</span>
                  </div>
                </div>

                {/* 1st */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-black text-3xl mb-2 border-4 border-yellow-500 shadow-lg shadow-yellow-900/50">
                    {top3[0]?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-white font-bold text-base mb-1 max-w-24 truncate text-center">{top3[0]?.name}</div>
                  <div className="text-yellow-400 text-sm font-semibold mb-2">{getValue(top3[0])}</div>
                  <div className="bg-yellow-600 text-white text-center py-4 px-8 rounded-t-xl" style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="text-4xl">🥇</span>
                  </div>
                </div>

                {/* 3rd */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-black text-2xl mb-2 border-4 border-orange-700">
                    {top3[2]?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-white font-semibold text-sm mb-1 max-w-20 truncate text-center">{top3[2]?.name}</div>
                  <div className="text-gray-400 text-xs mb-2">{getValue(top3[2])}</div>
                  <div className="bg-orange-800 text-white text-center py-4 px-6 rounded-t-xl" style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="text-3xl">🥉</span>
                  </div>
                </div>
              </div>
            )}

            {/* Full List */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="bg-gray-800/50 px-6 py-3 flex items-center gap-4 border-b border-gray-700">
                <span className="text-gray-500 text-xs font-semibold w-8">#</span>
                <span className="text-gray-500 text-xs font-semibold flex-1">শিক্ষার্থী</span>
                <span className="text-gray-500 text-xs font-semibold">🪙 কয়েন</span>
                <span className="text-gray-500 text-xs font-semibold">💎 ডায়মন্ড</span>
                <span className="text-gray-500 text-xs font-semibold">⭐ পয়েন্ট</span>
              </div>

              {sorted.map((player, i) => {
                const isMe = currentUser?.id === player.id
                const badges = ['🥇', '🥈', '🥉']
                return (
                  <div key={player.id}
                    className={`flex items-center gap-4 px-6 py-4 border-b border-gray-800 last:border-0 transition ${
                      isMe ? 'bg-purple-900/20 border-l-2 border-l-purple-500' :
                      i === 0 ? 'bg-yellow-900/10' :
                      'hover:bg-gray-800/30'
                    }`}>
                    <span className="w-8 text-center text-sm font-bold text-gray-400">
                      {i < 3 ? badges[i] : `${i + 1}`}
                    </span>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                        i === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                        i === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                        i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                        'bg-gradient-to-br from-purple-600 to-pink-600'
                      }`}>
                        {player.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-white font-semibold text-sm truncate">
                          {player.name}
                          {isMe && <span className="ml-2 text-purple-400 text-xs font-normal">(আপনি)</span>}
                        </div>
                        <div className="text-gray-500 text-xs">{player.email?.split('@')[0]}</div>
                      </div>
                    </div>
                    <div className="text-yellow-400 font-semibold text-sm w-16 text-right">{(player.coins || 0).toLocaleString()}</div>
                    <div className="text-cyan-400 font-semibold text-sm w-16 text-right">{(player.diamonds || 0).toLocaleString()}</div>
                    <div className="text-purple-400 font-semibold text-sm w-16 text-right">{(player.points || 0).toLocaleString()}</div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}