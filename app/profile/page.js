'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useToast } from '../components/Toast'

// ─── Exchange Widget ───────────────────────────────────────
function ExchangeWidget({ diamonds, coins, userId, onSuccess, addToast }) {
  // const { addToast } = useToast()
  const [amount, setAmount] = useState(10)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const maxExchange = Math.floor(diamonds / 10) * 10
  const coinsToGet = (amount / 10) * 30
  const [skills, setSkills] = useState([])
  const [editingSkills, setEditingSkills] = useState(false)
  const [skillsForm, setSkillsForm] = useState([])

  const handleExchange = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, diamonds: amount })
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error })
        addToast(data.error, 'error')
      } else {
        setMessage({ type: 'success', text: data.message })
        onSuccess(data.new_diamonds, data.new_coins)
        setAmount(10)
        addToast(`💱 Exchange সফল! -${amount} 💎 → +${coinsToGet} 🪙`, 'coin', 4000)
      }
    } catch {
      setMessage({ type: 'error', text: 'নেটওয়ার্ক সমস্যা' })
    } finally {
      setLoading(false)
    }
  }

  const iStyle = { width: '100%', background: '#0d1117', border: '1px solid #30363d', color: '#e6edf3', padding: '8px 10px', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: '#0d1117', borderRadius: '8px', padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#8b949e', fontSize: '12px' }}>Rate:</span>
        <span style={{ color: '#e6edf3', fontSize: '12px', fontWeight: '600' }}>10 💎 = 30 🪙</span>
      </div>
      <div>
        <label style={{ color: '#8b949e', fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
          কত Diamond? (১০ এর গুণিতক)
        </label>
        <input type="number" min={10} max={maxExchange} step={10} value={amount}
          onChange={e => {
            const val = parseInt(e.target.value) || 10
            setAmount(Math.min(Math.max(Math.round(val / 10) * 10, 10), maxExchange))
          }}
          style={iStyle} />
      </div>
      <div style={{ background: '#0d1117', borderRadius: '8px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#8b949e', fontSize: '12px' }}>পাবেন:</span>
        <span style={{ color: '#f0c000', fontSize: '16px', fontWeight: '800' }}>🪙 {coinsToGet} কয়েন</span>
      </div>
      <button onClick={handleExchange} disabled={loading || amount > diamonds || amount < 10}
        style={{ background: '#0891b2', border: 'none', color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', opacity: (loading || amount > diamonds || amount < 10) ? 0.5 : 1 }}>
        {loading ? '⏳ হচ্ছে...' : `💎 ${amount} → 🪙 ${coinsToGet} Exchange করুন`}
      </button>
      {message && (
        <div style={{ background: message.type === 'success' ? '#0d2818' : '#2a0a00', border: `1px solid ${message.type === 'success' ? '#2ea04344' : '#f7816644'}`, color: message.type === 'success' ? '#3fb950' : '#f78166', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }}>
          {message.text}
        </div>
      )}
      <p style={{ color: '#484f58', fontSize: '11px', textAlign: 'center', margin: 0 }}>
        আপনার: {diamonds} 💎 | Exchange-এর পরে বাকি: {diamonds - amount} 💎
      </p>
    </div>
  )
}

// ─── Main Profile Component ────────────────────────────────
export default function Profile() {
  const { addToast } = useToast()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', bio: '', location: '', github: '', linkedin: '' })
  const [editingLinks, setEditingLinks] = useState(false)
  const [linksForm, setLinksForm] = useState({ website: '', socialLinks: [] })
  const [activityData, setActivityData] = useState({})
  const [coins, setCoins] = useState(0)
  const [diamonds, setDiamonds] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('user')
    if (saved) {
      try {
        const u = JSON.parse(saved)
        setUser(u)
        setForm({ name: u.name || '', bio: u.bio || '', location: u.location || '', github: u.github || '', linkedin: u.linkedin || '' })
        setLinksForm({ website: u.website || '', socialLinks: u.socialLinks || [] })

        fetch(`/api/coins?userId=${u.id}`)
          .then(res => res.json())
          .then(data => {
            setCoins(data.coins || 0)
            setDiamonds(data.diamonds || 0)
          })

        fetch(`/api/profile?userId=${u.id}`)
          .then(res => res.json())
          .then(data => setSkills(data.skills || []))
        
        fetch(`/api/activity?userId=${u.id}`)
          .then(res => res.json())
          .then(data => {
            const map = {}
            data.activity.forEach(a => { map[a.activity_date] = a.count })
            setActivityData(map)
          })
      } catch (e) {
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    } else {
      window.location.href = '/login'
    }
  }, [])

  const saveProfile = () => {
    const updated = { ...user, ...form }
    setUser(updated)
    localStorage.setItem('user', JSON.stringify(updated))
    setEditing(false)
  }

const openSkillsEdit = () => {
    setSkillsForm(skills.length > 0 ? [...skills] : [{ name: '', level: 1 }])
    setEditingSkills(true)
  }

  const addSkill = () => {
    setSkillsForm([...skillsForm, { name: '', level: 1 }])
  }

  const removeSkill = (i) => {
    setSkillsForm(skillsForm.filter((_, idx) => idx !== i))
  }

  const updateSkill = (i, field, value) => {
    const updated = [...skillsForm]
    updated[i] = { ...updated[i], [field]: value }
    setSkillsForm(updated)
  }

  const saveSkills = async () => {
    const cleaned = skillsForm.filter(s => s.name.trim() !== '')
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, skills: cleaned })
      })
      setSkills(cleaned)
      const updated = { ...user, skills: cleaned }
      localStorage.setItem('user', JSON.stringify(updated))
    } catch (err) {
      console.error(err)
    }
    setEditingSkills(false)
  }

  const addSocialLink = () => {
    setLinksForm({ ...linksForm, socialLinks: [...linksForm.socialLinks, { id: Date.now().toString(), platform: 'facebook', url: '' }] })
  }

  const updateSocialLink = (id, field, value) => {
    setLinksForm({ ...linksForm, socialLinks: linksForm.socialLinks.map(l => l.id === id ? { ...l, [field]: value } : l) })
  }

  const removeSocialLink = (id) => {
    setLinksForm({ ...linksForm, socialLinks: linksForm.socialLinks.filter(l => l.id !== id) })
  }

  const saveLinks = () => {
    const cleaned = linksForm.socialLinks.filter(l => l.url.trim() !== '')
    const updated = { ...user, website: linksForm.website.trim(), socialLinks: cleaned }
    setUser(updated)
    localStorage.setItem('user', JSON.stringify(updated))
    setLinksForm({ website: updated.website, socialLinks: cleaned })
    setEditingLinks(false)
  }

  const cancelLinksEdit = () => {
    setLinksForm({ website: user.website || '', socialLinks: user.socialLinks || [] })
    setEditingLinks(false)
  }

  const platformMeta = {
    facebook: { icon: '📘', label: 'Facebook' },
    twitter: { icon: '🐦', label: 'Twitter/X' },
    instagram: { icon: '📷', label: 'Instagram' },
    youtube: { icon: '▶️', label: 'YouTube' },
    telegram: { icon: '✈️', label: 'Telegram' },
    other: { icon: '🔗', label: 'অন্যান্য' },
  }

  const heatmap = useMemo(() => {
    const days = []
    const today = new Date()
    for (let i = 181; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const count = activityData[dateStr] || 0
      const color = count >= 5 ? '#3fb950' : count >= 3 ? '#2ea04366' : count >= 1 ? '#2ea04322' : '#21262d'
      days.push(color)
    }
    return days
  }, [activityData])

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'white' }}>লোড হচ্ছে...</div>
    </div>
  )

  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const badges = [
    { icon: '🔥', title: 'First Code', earned: true, stars: 3 },
    { icon: '⚡', title: 'Speed Coder', earned: false, stars: 0 },
    { icon: '🎯', title: 'Perfect Score', earned: false, stars: 0 },
    { icon: '🏆', title: 'Mission Hero', earned: false, stars: 0 },
    { icon: '📚', title: 'Course Master', earned: false, stars: 0 },
    { icon: '🌟', title: 'Top 10', earned: false, stars: 0 },
  ]

  const skills = [
    { name: 'C', level: 2 },
    { name: 'C++', level: 1 },
    { name: 'Python', level: 0 },
    { name: 'Algorithms', level: 1 },
  ]

  const card = { background: '#161b22', border: '1px solid #30363d', borderRadius: '12px' }
  const hasLinks = Boolean(user.website) || (user.socialLinks && user.socialLinks.length > 0)

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', fontSize: '14px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Left Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Profile Card */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #1f1035, #0d2818)', height: '80px', position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: '-40px', left: '20px', width: '80px', height: '80px', background: 'linear-gradient(135deg, #7c3aed, #2ea043)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', color: 'white', border: '3px solid #161b22', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>
                {initials}
              </div>
            </div>
            <div style={{ padding: '48px 20px 20px' }}>
              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { key: 'name', label: 'নাম', placeholder: 'আপনার নাম' },
                    { key: 'bio', label: 'বায়ো', placeholder: 'নিজের সম্পর্কে লিখুন' },
                    { key: 'location', label: 'অবস্থান', placeholder: 'Dhaka, Bangladesh' },
                    { key: 'github', label: 'GitHub', placeholder: 'username' },
                    { key: 'linkedin', label: 'LinkedIn', placeholder: 'profile URL' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: '11px', color: '#8b949e', fontWeight: '600', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>{f.label}</label>
                      <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', color: '#e6edf3', padding: '8px 10px', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button onClick={saveProfile} style={{ flex: 1, background: '#238636', border: 'none', color: 'white', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>সংরক্ষণ</button>
                    <button onClick={() => setEditing(false)} style={{ flex: 1, background: '#21262d', border: '1px solid #30363d', color: '#8b949e', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>বাতিল</button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 style={{ color: '#e6edf3', fontWeight: '700', fontSize: '18px', margin: '0 0 2px' }}>{user.name}</h2>
                  <p style={{ color: '#8b949e', fontSize: '13px', margin: '0 0 10px' }}>@{user.email?.split('@')[0]}</p>
                  {user.bio && <p style={{ color: '#c9d1d9', fontSize: '13px', margin: '0 0 10px', lineHeight: '1.5' }}>{user.bio}</p>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                    {user.location && <span style={{ color: '#8b949e', fontSize: '13px' }}>📍 {user.location}</span>}
                    {user.github && (
                      <a href={`https://github.com/${user.github}`} target="_blank" rel="noreferrer"
                        style={{ color: '#58a6ff', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                        </svg>
                        github.com/{user.github}
                      </a>
                    )}
                    {user.linkedin && (
                      <a href={user.linkedin} target="_blank" rel="noreferrer"
                        style={{ color: '#58a6ff', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        LinkedIn Profile
                      </a>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                    <span style={{ background: '#1f2937', border: '1px solid #374151', color: '#a371f7', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                      {user.role === 'admin' ? '👑 Admin' : '🎓 Student'}
                    </span>
                  </div>
                  <button onClick={() => setEditing(true)}
                    style={{ width: '100%', background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                    ✏️ প্রোফাইল এডিট
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ ...card, padding: '16px 20px' }}>
            <h4 style={{ color: '#8b949e', fontWeight: '600', margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>পরিসংখ্যান</h4>
            {[
              { label: '🪙 কয়েন', value: coins, color: '#f0c000' },
              { label: '💎 ডায়মন্ড', value: diamonds, color: '#22d3ee' },
              { label: 'মোট পয়েন্ট', value: user.points || 0, color: '#a371f7' },
              { label: 'কোর্স সম্পন্ন', value: 0, color: '#3fb950' },
            ].map((stat, i, arr) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #21262d' : 'none' }}>
                <span style={{ color: '#8b949e', fontSize: '13px' }}>{stat.label}</span>
                <span style={{ color: stat.color, fontWeight: '700', fontSize: '16px' }}>{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Diamond Exchange */}
          <div style={{ ...card, padding: '16px 20px' }}>
            <h4 style={{ color: '#8b949e', fontWeight: '600', margin: '0 0 12px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💎 → 🪙 Exchange</h4>
            {diamonds < 50 ? (
              <div style={{ background: '#0d1117', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <p style={{ color: '#484f58', fontSize: '12px', margin: '0 0 6px' }}>Exchange করতে minimum ৫০ 💎 লাগবে</p>
                <div style={{ background: '#21262d', borderRadius: '6px', height: '6px', overflow: 'hidden', margin: '8px 0' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #22d3ee, #0891b2)', borderRadius: '6px', width: `${Math.min((diamonds / 50) * 100, 100)}%`, transition: 'width 0.3s' }} />
                </div>
                <p style={{ color: '#22d3ee', fontSize: '11px', margin: 0 }}>{diamonds}/50 💎</p>
              </div>
            ) : (
              <ExchangeWidget
                diamonds={diamonds}
                coins={coins}
                userId={user.id}
                addToast={addToast}
                onSuccess={(newDiamonds, newCoins) => {
                  setDiamonds(newDiamonds)
                  setCoins(newCoins)
                }}
              />
            )}
          </div>

          {/* Skills */}
          {/* Skills */}
          <div style={{ ...card, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ color: '#8b949e', fontWeight: '600', margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>দক্ষতা</h4>
              {!editingSkills && (
                <button onClick={openSkillsEdit}
                  style={{ background: 'transparent', border: '1px solid #30363d', color: '#8b949e', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
                  ✏️ এডিট
                </button>
              )}
            </div>

            {editingSkills ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {skillsForm.map((skill, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      value={skill.name}
                      onChange={e => updateSkill(i, 'name', e.target.value)}
                      placeholder="যেমন: Python"
                      style={{ flex: 1, background: '#0d1117', border: '1px solid #30363d', color: '#e6edf3', padding: '7px 10px', borderRadius: '6px', fontSize: '12px', outline: 'none' }}
                    />
                    <select
                      value={skill.level}
                      onChange={e => updateSkill(i, 'level', parseInt(e.target.value))}
                      style={{ background: '#0d1117', border: '1px solid #30363d', color: '#e6edf3', padding: '7px', borderRadius: '6px', fontSize: '12px', outline: 'none' }}>
                      <option value={0}>Beginner</option>
                      <option value={1}>Intermediate</option>
                      <option value={2}>Advanced</option>
                    </select>
                    <button onClick={() => removeSkill(i)}
                      style={{ background: 'none', border: 'none', color: '#f78166', cursor: 'pointer', fontSize: '14px', padding: '0 4px' }}>✕</button>
                  </div>
                ))}
                <button onClick={addSkill}
                  style={{ background: 'transparent', border: '1px dashed #30363d', color: '#8b949e', padding: '6px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', width: '100%' }}>
                  + নতুন skill
                </button>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button onClick={saveSkills}
                    style={{ flex: 1, background: '#238636', border: 'none', color: 'white', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                    সংরক্ষণ
                  </button>
                  <button onClick={() => setEditingSkills(false)}
                    style={{ flex: 1, background: '#21262d', border: '1px solid #30363d', color: '#8b949e', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    বাতিল
                  </button>
                </div>
              </div>
            ) : skills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <p style={{ color: '#484f58', fontSize: '12px', margin: '0 0 10px' }}>এখনো কোনো skill যোগ করেননি</p>
                <button onClick={openSkillsEdit}
                  style={{ background: '#238636', border: 'none', color: 'white', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                  + Skill যোগ করুন
                </button>
              </div>
            ) : (
              skills.map((skill, i) => (
                <div key={i} style={{ marginBottom: i < skills.length - 1 ? '12px' : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: '#c9d1d9', fontSize: '13px', fontWeight: '600' }}>{skill.name}</span>
                    <span style={{ color: '#484f58', fontSize: '11px' }}>{['Beginner', 'Intermediate', 'Advanced'][skill.level] || 'Beginner'}</span>
                  </div>
                  <div style={{ background: '#21262d', borderRadius: '4px', height: '5px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg, #3fb950, #2ea043)', borderRadius: '4px', width: `${[25, 55, 90][skill.level] || 25}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Logout */}
          <button onClick={() => { localStorage.removeItem('user'); window.location.href = '/' }}
            style={{ width: '100%', background: '#21262d', border: '1px solid #f7816644', color: '#f78166', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            🚪 লগআউট
          </button>
        </div>

        {/* Right Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #30363d' }}>
              {[
                { key: 'overview', label: '📊 Overview' },
                { key: 'badges', label: '🏅 Badges' },
                { key: 'certificates', label: '📜 Certificates' },
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  style={{ padding: '12px 20px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: activeTab === tab.key ? '#3fb950' : '#6e7681', borderBottom: `2px solid ${activeTab === tab.key ? '#3fb950' : 'transparent'}`, marginBottom: '-1px', transition: 'all 0.15s' }}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '24px' }}>

              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <h4 style={{ color: '#c9d1d9', fontWeight: '700', marginBottom: '12px', fontSize: '14px' }}>কার্যক্রম (গত ৬ মাস)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(26, 1fr)', gap: '3px' }}>
                      {heatmap.map((bg, i) => (
                        <div key={i} style={{ aspectRatio: '1', borderRadius: '2px', background: bg }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginTop: '8px', alignItems: 'center' }}>
                      <span style={{ color: '#484f58', fontSize: '11px' }}>কম</span>
                      {['#21262d', '#2ea04322', '#2ea04366', '#3fb950'].map((c, i) => (
                        <div key={i} style={{ width: '11px', height: '11px', borderRadius: '2px', background: c }} />
                      ))}
                      <span style={{ color: '#484f58', fontSize: '11px' }}>বেশি</span>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ color: '#c9d1d9', fontWeight: '700', marginBottom: '12px', fontSize: '14px' }}>সমস্যা সমাধানের ইতিহাস</h4>
                    <div style={{ background: '#0d1117', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
                      <div style={{ fontSize: '36px', marginBottom: '8px' }}>📭</div>
                      <p style={{ color: '#484f58', fontSize: '13px', margin: '0 0 14px' }}>এখনো কোনো সমস্যা সমাধান করেননি</p>
                      <Link href="/practice" style={{ background: '#238636', color: 'white', padding: '8px 18px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}>
                        প্র্যাকটিস শুরু করুন →
                      </Link>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ color: '#c9d1d9', fontWeight: '700', fontSize: '14px', margin: 0 }}>লিংক ও সোশ্যাল মিডিয়া</h4>
                      {!editingLinks && (
                        <button onClick={() => setEditingLinks(true)}
                          style={{ background: 'transparent', border: '1px solid #30363d', color: '#8b949e', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                          ✏️ এডিট
                        </button>
                      )}
                    </div>

                    {editingLinks ? (
                      <div style={{ background: '#0d1117', borderRadius: '8px', padding: '20px' }}>
                        <div style={{ marginBottom: '14px' }}>
                          <label style={{ fontSize: '11px', color: '#8b949e', fontWeight: '600', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>পার্সোনাল ওয়েবসাইট</label>
                          <input value={linksForm.website} onChange={e => setLinksForm({ ...linksForm, website: e.target.value })}
                            placeholder="https://yourwebsite.com"
                            style={{ width: '100%', background: '#161b22', border: '1px solid #30363d', color: '#e6edf3', padding: '8px 10px', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <label style={{ fontSize: '11px', color: '#8b949e', fontWeight: '600', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>সোশ্যাল মিডিয়া লিংক</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                          {linksForm.socialLinks.map(link => (
                            <div key={link.id} style={{ display: 'flex', gap: '8px' }}>
                              <select value={link.platform} onChange={e => updateSocialLink(link.id, 'platform', e.target.value)}
                                style={{ background: '#161b22', border: '1px solid #30363d', color: '#e6edf3', padding: '8px', borderRadius: '6px', fontSize: '13px', outline: 'none', width: '140px', flexShrink: 0 }}>
                                {Object.entries(platformMeta).map(([key, meta]) => (
                                  <option key={key} value={key}>{meta.icon} {meta.label}</option>
                                ))}
                              </select>
                              <input value={link.url} onChange={e => updateSocialLink(link.id, 'url', e.target.value)}
                                placeholder="প্রোফাইল লিংক দিন"
                                style={{ flex: 1, background: '#161b22', border: '1px solid #30363d', color: '#e6edf3', padding: '8px 10px', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', minWidth: 0 }} />
                              <button onClick={() => removeSocialLink(link.id)}
                                style={{ background: '#21262d', border: '1px solid #30363d', color: '#f78166', padding: '0 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', flexShrink: 0 }}>✕</button>
                            </div>
                          ))}
                        </div>
                        <button onClick={addSocialLink}
                          style={{ background: 'transparent', border: '1px dashed #30363d', color: '#8b949e', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', width: '100%', marginBottom: '16px' }}>
                          + আরেকটি লিংক যুক্ত করুন
                        </button>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={saveLinks} style={{ flex: 1, background: '#238636', border: 'none', color: 'white', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>সংরক্ষণ</button>
                          <button onClick={cancelLinksEdit} style={{ flex: 1, background: '#21262d', border: '1px solid #30363d', color: '#8b949e', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>বাতিল</button>
                        </div>
                      </div>
                    ) : hasLinks ? (
                      <div style={{ background: '#0d1117', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {user.website && (
                          <a href={user.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#58a6ff', fontSize: '13px', textDecoration: 'none' }}>
                            🌐 {user.website}
                          </a>
                        )}
                        {(user.socialLinks || []).map(link => (
                          <a key={link.id} href={link.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#58a6ff', fontSize: '13px', textDecoration: 'none' }}>
                            {platformMeta[link.platform]?.icon || '🔗'} {link.url}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div style={{ background: '#0d1117', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
                        <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔗</div>
                        <p style={{ color: '#484f58', fontSize: '13px', margin: '0 0 14px' }}>এখনো কোনো ওয়েবসাইট বা সোশ্যাল লিংক যুক্ত করেননি</p>
                        <button onClick={() => setEditingLinks(true)}
                          style={{ background: '#238636', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
                          লিংক যুক্ত করুন →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'badges' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                  {badges.map((badge, i) => (
                    <div key={i} style={{ background: badge.earned ? '#0d2818' : '#0d1117', border: `1px solid ${badge.earned ? '#2ea04344' : '#21262d'}`, borderRadius: '10px', padding: '20px', textAlign: 'center', opacity: badge.earned ? 1 : 0.5 }}>
                      <div style={{ fontSize: '36px', marginBottom: '8px' }}>{badge.icon}</div>
                      <div style={{ color: '#e6edf3', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>{badge.title}</div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginBottom: '6px' }}>
                        {[1, 2, 3].map(s => (
                          <span key={s} style={{ color: s <= badge.stars ? '#f0c000' : '#30363d', fontSize: '14px' }}>★</span>
                        ))}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: badge.earned ? '#3fb950' : '#484f58' }}>
                        {badge.earned ? '✓ অর্জিত' : '🔒 লক'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'certificates' && (
                <div style={{ background: '#0d1117', borderRadius: '8px', padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📜</div>
                  <h3 style={{ color: '#c9d1d9', fontWeight: '700', marginBottom: '8px' }}>কোনো সার্টিফিকেট নেই</h3>
                  <p style={{ color: '#484f58', fontSize: '13px', marginBottom: '16px' }}>একটি কোর্স সম্পন্ন করলে সার্টিফিকেট পাবেন</p>
                  <Link href="/courses" style={{ background: '#7c3aed', color: 'white', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '700' }}>
                    কোর্স দেখুন →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}