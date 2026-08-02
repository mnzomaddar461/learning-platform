'use client'
import { use, useState, useEffect } from 'react'
import { useToast } from '../../components/Toast'

export default function MissionDetail({ params }) {
  const { addToast } = useToast()
  const { id } = use(params)
  const [mission, setMission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [registered, setRegistered] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', country_code: '+880' })

  useEffect(() => {
    fetch('/api/missions')
      .then(res => res.json())
      .then(data => {
        const found = (data.missions || []).find(m => m.id === id)
        setMission(found || null)
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (!mission?.end_date) return
    const target = new Date(mission.end_date)
    const timer = setInterval(() => {
      const now = new Date()
      const diff = target - now
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

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) return
    if (submitting) return
    setSubmitting(true)

    const savedUser = localStorage.getItem('user')
    const u = savedUser ? JSON.parse(savedUser) : null

    try {
      const res = await fetch('/api/mission-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone ? `${formData.country_code}${formData.phone}` : null,
          mission_id: id,
          mission_name: mission.title,
          userId: u?.id || null
        })
      })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 403) {
          alert(data.error)
          localStorage.removeItem('user')
          window.location.href = '/login'
        } else {
          alert('রেজিস্ট্রেশন ব্যর্থ হয়েছে: ' + (data.error || 'অজানা সমস্যা'))
        }
        setSubmitting(false)
        return
      }
    } catch (err) {
      console.error('Registration error:', err)
      alert('একটি সমস্যা হয়েছে')
      setSubmitting(false)
      return
    }

    if (u) {
      if ((mission.coin_reward || 0) > 0) {
        await fetch('/api/coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: u.id,
            amount: mission.coin_reward,
            type: 'admin_grant',
            description: `mission_${id}_registered`
          })
        })
      }

      if ((mission.diamond_reward || 0) > 0) {
        await fetch('/api/coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: u.id,
            amount: mission.diamond_reward,
            type: 'mission_complete',
            description: `mission_${id}_diamond`
          })
        })
      }
    }

    addToast('🚀 Mission রেজিস্ট্রেশন সফল!', 'success', 4000)
    if ((mission.coin_reward || 0) > 0) {
      addToast(`🪙 +${mission.coin_reward} কয়েন পেয়েছেন!`, 'coin', 5000)
    }
    if ((mission.diamond_reward || 0) > 0) {
      addToast(`💎 +${mission.diamond_reward} ডায়মন্ড পেয়েছেন!`, 'diamond', 5000)
    }
    setShowForm(false)
    setRegistered(true)
    setSubmitting(false)
  }

  const leaderboard = [
    { rank: 1, name: 'Rakib Hassan', score: 980, badge: '🥇', city: 'Dhaka' },
    { rank: 2, name: 'Nusrat Jahan', score: 920, badge: '🥈', city: 'Chittagong' },
    { rank: 3, name: 'Farhan Ahmed', score: 875, badge: '🥉', city: 'Sylhet' },
    { rank: 4, name: 'Mitu Akter', score: 810, badge: '⭐', city: 'Rajshahi' },
    { rank: 5, name: 'Sabbir Khan', score: 760, badge: '⭐', city: 'Khulna' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">লোড হচ্ছে...</div>
      </div>
    )
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">মিশন পাওয়া যায়নি</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">

      {/* Registration Popup */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.75)' }}>
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{mission.icon || '🚀'}</div>
              <h2 className="text-white font-black text-2xl mb-1">{mission.title}</h2>
              <p className="text-gray-400 text-sm">রেজিস্ট্রেশন ফর্ম পূরণ করুন</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-2">পূর্ণ নাম *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="আপনার নাম লিখুন"
                  className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl outline-none focus:border-orange-500 transition" />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-2">ইমেইল *</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="আপনার ইমেইল লিখুন"
                  className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl outline-none focus:border-orange-500 transition" />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-2">ফোন নম্বর</label>
                <div className="flex gap-2">
                  <select
                    value={formData.country_code}
                    onChange={e => setFormData({...formData, country_code: e.target.value})}
                    className="bg-gray-800 border border-gray-700 text-white px-3 py-3 rounded-xl outline-none focus:border-orange-500 transition w-28 flex-shrink-0 text-sm">
                    <option value="+880">🇧🇩 +880</option>
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+966">🇸🇦 +966</option>
                    <option value="+60">🇲🇾 +60</option>
                    <option value="+65">🇸🇬 +65</option>
                    <option value="+49">🇩🇪 +49</option>
                  </select>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="01XXXXXXXXX"
                    className="flex-1 bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl outline-none focus:border-orange-500 transition" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-xl transition">বাতিল</button>
              <button onClick={handleSubmit} disabled={!formData.name || !formData.email || submitting}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition">
                {submitting ? 'অপেক্ষা করুন...' : 'রেজিস্ট্রেশন করুন ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-900/20 via-gray-950 to-gray-950 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 py-20 text-center relative">
          <div className="inline-flex items-center gap-2 bg-orange-900/40 border border-orange-700/50 text-orange-300 px-4 py-2 rounded-full text-sm mb-8">
            <span className="animate-pulse">{mission.is_active ? '🔴' : '⚪'}</span>
            <span>{mission.is_active ? 'Live — রেজিস্ট্রেশন চলছে' : 'মিশন শেষ হয়েছে'}</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-pink-400">
              {mission.title}
            </span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-12">{mission.description}</p>

          {mission.end_date && (
            <div className="flex items-center justify-center gap-4 mb-12">
              {[
                { value: timeLeft.days, label: 'দিন' },
                { value: timeLeft.hours, label: 'ঘণ্টা' },
                { value: timeLeft.minutes, label: 'মিনিট' },
                { value: timeLeft.seconds, label: 'সেকেন্ড' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="bg-gray-900 border border-gray-700 rounded-2xl w-20 h-20 flex items-center justify-center mb-2">
                    <span className="text-3xl font-black text-white font-mono">{String(item.value).padStart(2, '0')}</span>
                  </div>
                  <span className="text-gray-500 text-xs">{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {registered ? (
            <div className="inline-flex items-center gap-3 bg-green-900/30 border border-green-700/50 text-green-400 px-8 py-4 rounded-2xl text-lg font-semibold">
              ✅ রেজিস্ট্রেশন সম্পন্ন! মিশনের জন্য প্রস্তুত থাকুন।
            </div>
          ) : mission.is_active ? (
            <button onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white px-10 py-4 rounded-2xl text-lg font-bold transition shadow-2xl shadow-orange-900/40">
              এখনই রেজিস্ট্রেশন করুন বিনামূল্যে
            </button>
          ) : (
            <div className="text-gray-500">এই মিশনে রেজিস্ট্রেশন বন্ধ</div>
          )}
          <p className="text-gray-600 text-sm mt-4">
            সর্বোচ্চ {mission.max_participants} জনের মধ্যে {mission.registered_count} জন নিবন্ধিত
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="border-y border-gray-800 bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: `৳${mission.prize_amount}`, label: 'মোট পুরস্কার', icon: '🏆' },
            { value: `${mission.max_participants} জন`, label: 'সর্বোচ্চ অংশগ্রহণকারী', icon: '👥' },
            { value: mission.start_date ? new Date(mission.start_date).toLocaleDateString('bn-BD') : '-', label: 'শুরুর তারিখ', icon: '⏱' },
            { value: `${mission.registered_count} জন`, label: 'ইতিমধ্যে নিবন্ধিত', icon: '✅' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rules + Leaderboard */}
      <div className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">📜 মিশনের নিয়ম</h2>
          <div className="space-y-4">
            {[
              { num: '01', title: 'রেজিস্ট্রেশন', desc: `বিনামূল্যে নিবন্ধন করুন। সর্বোচ্চ ${mission.max_participants} জন অংশ নিতে পারবেন।` },
              { num: '02', title: 'সমস্যা সমাধান', desc: 'নির্ধারিত সময়ে যতটা সম্ভব সমস্যা সমাধান করুন।' },
              { num: '03', title: 'পয়েন্ট সিস্টেম', desc: 'কঠিন সমস্যা বেশি পয়েন্ট। দ্রুত সমাধানে বোনাস পয়েন্ট।' },
              { num: '04', title: 'পুরস্কার', desc: 'শীর্ষ ১০ জন পাবেন পুরস্কার, সার্টিফিকেট ও বিশেষ ব্যাজ।' },
            ].map((rule, i) => (
              <div key={i} className="flex gap-4 p-4 bg-gray-900 border border-gray-800 rounded-xl">
                <span className="text-orange-400 font-black text-lg font-mono flex-shrink-0">{rule.num}</span>
                <div>
                  <div className="text-white font-semibold mb-1">{rule.title}</div>
                  <div className="text-gray-400 text-sm">{rule.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-6">🏅 গত মিশনের সেরারা</h2>
          <div className="space-y-3">
            {leaderboard.map((player) => (
              <div key={player.rank} className={`flex items-center gap-4 p-4 rounded-xl border ${
                player.rank === 1 ? 'bg-yellow-900/20 border-yellow-700/40' :
                player.rank === 2 ? 'bg-gray-800/50 border-gray-700/40' :
                player.rank === 3 ? 'bg-orange-900/20 border-orange-700/40' :
                'bg-gray-900 border-gray-800'
              }`}>
                <span className="text-2xl">{player.badge}</span>
                <div className="flex-1">
                  <div className="text-white font-semibold">{player.name}</div>
                  <div className="text-gray-500 text-xs">{player.city}</div>
                </div>
                <div className="text-right">
                  <div className="text-yellow-400 font-bold">{player.score}</div>
                  <div className="text-gray-600 text-xs">পয়েন্ট</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prizes */}
      <div className="bg-gray-900 border-t border-gray-800 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-10 text-center">🎁 পুরস্কার তালিকা</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { pos: '১ম স্থান', prize: `৳${Math.round(mission.prize_amount * 0.4)}`, icon: '🥇', color: 'from-yellow-600/20 to-yellow-800/10', border: 'border-yellow-700/40', extra: '+ সার্টিফিকেট + বিশেষ ব্যাজ' },
              { pos: '২য় স্থান', prize: `৳${Math.round(mission.prize_amount * 0.3)}`, icon: '🥈', color: 'from-gray-600/20 to-gray-800/10', border: 'border-gray-600/40', extra: '+ সার্টিফিকেট + ব্যাজ' },
              { pos: '৩য় স্থান', prize: `৳${Math.round(mission.prize_amount * 0.2)}`, icon: '🥉', color: 'from-orange-600/20 to-orange-800/10', border: 'border-orange-700/40', extra: '+ সার্টিফিকেট + ব্যাজ' },
            ].map((prize, i) => (
              <div key={i} className={`bg-gradient-to-br ${prize.color} border ${prize.border} rounded-2xl p-6 text-center`}>
                <div className="text-5xl mb-4">{prize.icon}</div>
                <div className="text-white font-bold text-lg mb-1">{prize.pos}</div>
                <div className="text-3xl font-black text-white mb-2">{prize.prize}</div>
                <div className="text-gray-400 text-sm">{prize.extra}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}