'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Admin() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [registrations, setRegistrations] = useState([])
  const [coinUserId, setCoinUserId] = useState('')
  const [coinAmount, setCoinAmount] = useState('')
  const [coinType, setCoinType] = useState('coins')
  const [coinMessage, setCoinMessage] = useState('')
  const [userActionMsg, setUserActionMsg] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  // Courses
  const [courses, setCourses] = useState([])
  const [courseModalOpen, setCourseModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [courseForm, setCourseForm] = useState({
      title: '', description: '', level: '', duration: '', lessons: '',
      icon: '📚', price: '', is_paid: false, topics: '',
      color: 'from-purple-600 to-purple-800', badge: '',
      coin_reward: 100, diamond_reward: 0,
      coin_unlock_price: 0
    })

  // Missions
  const [missions, setMissions] = useState([])
  const [missionModalOpen, setMissionModalOpen] = useState(false)
  const [editingMission, setEditingMission] = useState(null)
  const [missionForm, setMissionForm] = useState({
    title: '', description: '', prize_amount: '', max_participants: '',
    start_date: '', end_date: '', coin_reward: 50, diamond_reward: 0
  })

  useEffect(() => {
    const saved = localStorage.getItem('user')
    if (!saved) { window.location.href = '/login'; return }
    const u = JSON.parse(saved)
    if (u.role !== 'admin') { window.location.href = '/dashboard'; return }
    setUser(u)

    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => setUsers(data.users || []))

    fetch('/api/admin/registrations')
      .then(res => res.json())
      .then(data => setRegistrations(data.registrations || []))

    loadCourses()
    loadMissions()
    setLoading(false)
  }, [])

  const loadCourses = () => {
    fetch('/api/admin/courses')
      .then(res => res.json())
      .then(data => setCourses(data.courses || []))
  }

  const loadMissions = () => {
    fetch('/api/admin/missions')
      .then(res => res.json())
      .then(data => setMissions(data.missions || []))
  }

  const giveCoinsManually = async () => {
    if (!coinUserId || !coinAmount) return
    setCoinMessage('')
    try {
      const res = await fetch('/api/coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: coinUserId,
          amount: parseInt(coinAmount),
          type: coinType === 'diamonds' ? 'mission_complete' : 'admin_grant',
          description: `admin_manual_${Date.now()}`
        })
      })
      const data = await res.json()
      setCoinMessage(`✅ সফলভাবে যোগ হয়েছে! এখন কয়েন: ${data.coins}, ডায়মন্ড: ${data.diamonds}`)
      setCoinAmount('')
    } catch (err) {
      setCoinMessage('❌ একটি সমস্যা হয়েছে')
    }
  }

  // ---------- Course handlers ----------
const openNewCourseModal = () => {
    setEditingCourse(null)
    setCourseForm({
      title: '', description: '', level: '', duration: '', lessons: '',
      icon: '📚', price: '', is_paid: false, topics: '',
      color: 'from-purple-600 to-purple-800', badge: '',
      coin_reward: 100, diamond_reward: 0,
      coin_unlock_price: 0
    })
    setCourseModalOpen(true)
  }

  const openEditCourseModal = (course) => {
    setEditingCourse(course)
    setCourseForm({
      title: course.title || '',
      description: course.description || '',
      level: course.level || '',
      duration: course.duration || '',
      lessons: course.lessons || '',
      icon: course.icon || '📚',
      price: course.price || '',
      is_paid: course.is_paid || false,
      topics: (course.topics || []).join(', '),
      color: course.color || 'from-purple-600 to-purple-800',
      badge: course.badge || '',
      coin_reward: course.coin_reward ?? 100,
      diamond_reward: course.diamond_reward ?? 0,
      coin_unlock_price: course.coin_unlock_price ?? 0
    })
    setCourseModalOpen(true)
  }

  const saveCourse = async () => {
    if (!courseForm.title) { alert('টাইটেল আবশ্যক'); return }
    const payload = {
      ...courseForm,
      lessons: parseInt(courseForm.lessons) || 0,
      price: parseInt(courseForm.price) || 0,
      topics: courseForm.topics.split(',').map(t => t.trim()).filter(Boolean),
      badge: courseForm.badge || null
    }

    try {
      let res
      if (editingCourse) {
        res = await fetch('/api/admin/courses', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCourse.id, ...payload })
        })
      } else {
        res = await fetch('/api/admin/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }
      const data = await res.json()
      if (!res.ok) {
        alert('সমস্যা হয়েছে: ' + (data.error || 'অজানা ত্রুটি'))
        console.error('Course save error:', data)
        return
      }
      setCourseModalOpen(false)
      loadCourses()
    } catch (err) {
      alert('নেটওয়ার্ক সমস্যা হয়েছে')
      console.error(err)
    }
  }

  const togglePublishCourse = async (course) => {
    await fetch('/api/admin/courses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: course.id, is_published: !course.is_published })
    })
    loadCourses()
  }

  const deleteCourse = async (course) => {
    if (!confirm(`"${course.title}" ডিলিট করতে চান?`)) return
    await fetch(`/api/admin/courses?id=${course.id}`, { method: 'DELETE' })
    loadCourses()
  }

  const manageUser = async (action, userId, userName) => {
    const confirmMsg = {
      ban: `"${userName}" কে ban করতে চান?`,
      unban: `"${userName}" কে unban করতে চান?`,
      reset: `"${userName}" এর সব data (points/coins/progress) reset করতে চান? এটা undo করা যাবে না।`,
    }
    if (!confirm(confirmMsg[action])) return

    let reason = ''
    if (action === 'ban') {
      reason = prompt('Ban-এর কারণ লিখুন (optional):') || 'Admin কর্তৃক ban'
    }

    setActionLoading(userId)
    setUserActionMsg('')

    try {
      const res = await fetch('/api/admin/manage-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId, reason })
      })
      const data = await res.json()
      if (!res.ok) {
        setUserActionMsg(`❌ ${data.error}`)
      } else {
        setUserActionMsg(`✅ ${data.message}`)
        // Users list refresh করো
        fetch('/api/admin/users')
          .then(r => r.json())
          .then(d => setUsers(d.users || []))
      }
    } catch {
      setUserActionMsg('❌ নেটওয়ার্ক সমস্যা')
    } finally {
      setActionLoading(null)
    }
  }

  // ---------- Mission handlers ----------
  const openNewMissionModal = () => {
    setEditingMission(null)
    setMissionForm({
      title: '', description: '', prize_amount: '', max_participants: '',
      start_date: '', end_date: '', coin_reward: 50, diamond_reward: 0
    })
    setMissionModalOpen(true)
  }

  const openEditMissionModal = (mission) => {
    setEditingMission(mission)
    setMissionForm({
      title: mission.title || '',
      description: mission.description || '',
      prize_amount: mission.prize_amount || '',
      max_participants: mission.max_participants || '',
      start_date: mission.start_date ? mission.start_date.slice(0, 10) : '',
      end_date: mission.end_date ? mission.end_date.slice(0, 10) : '',
      coin_reward: mission.coin_reward ?? 50,
      diamond_reward: mission.diamond_reward ?? 0
    })
    setMissionModalOpen(true)
  }

  const saveMission = async () => {
    if (!missionForm.title) { alert('টাইটেল আবশ্যক'); return }
    const payload = {
      ...missionForm,
      prize_amount: parseInt(missionForm.prize_amount) || 0,
      max_participants: parseInt(missionForm.max_participants) || 500
    }

    try {
      let res
      if (editingMission) {
        res = await fetch('/api/admin/missions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingMission.id, ...payload })
        })
      } else {
        res = await fetch('/api/admin/missions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }
      const data = await res.json()
      if (!res.ok) {
        alert('সমস্যা হয়েছে: ' + (data.error || 'অজানা ত্রুটি'))
        console.error('Mission save error:', data)
        return
      }
      setMissionModalOpen(false)
      loadMissions()
    } catch (err) {
      alert('নেটওয়ার্ক সমস্যা হয়েছে')
      console.error(err)
    }
  }

  const toggleActiveMission = async (mission) => {
    await fetch('/api/admin/missions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: mission.id, is_active: !mission.is_active })
    })
    loadMissions()
  }

  const stats = [
    { label: 'মোট ইউজার', value: users.length.toString(), icon: '👥', color: '#58a6ff' },
    { label: 'মোট কোর্স', value: courses.length.toString(), icon: '📚', color: '#3fb950' },
    { label: 'মোট মিশন', value: missions.length.toString(), icon: '🚀', color: '#f78166' },
    { label: 'মোট রেজিস্ট্রেশন', value: registrations.length.toString(), icon: '✅', color: '#f0c000' },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'white' }}>লোড হচ্ছে...</div>
    </div>
  )

  const card = { background: '#161b22', border: '1px solid #30363d', borderRadius: '12px' }
  const inputStyle = { width: '100%', background: '#0d1117', border: '1px solid #30363d', color: '#e6edf3', padding: '10px', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { color: '#8b949e', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }

  const tabs = [
    { key: 'dashboard', label: '📊 Dashboard' },
    { key: 'users', label: '👥 Users' },
    { key: 'courses', label: '📚 Courses' },
    { key: 'missions', label: '🚀 Missions' },
    { key: 'coins', label: '🪙 Coins' },
    { key: 'settings', label: '⚙️ Settings' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', display: 'flex', marginTop: '-64px' }}>

      {/* Sidebar */}
      <div style={{ width: '240px', background: '#161b22', borderRight: '1px solid #30363d', display: 'flex', flexDirection: 'column', position: 'fixed', top: '0', height: '100vh', zIndex: 40 }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #30363d' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ color: 'white', fontWeight: '800', fontSize: '16px' }}>LeapBangladesh</div>
            <div style={{ color: '#484f58', fontSize: '11px', marginTop: '2px' }}>Admin Panel</div>
          </Link>
        </div>

        <nav style={{ padding: '12px', flex: 1 }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginBottom: '2px', background: activeTab === tab.key ? '#1f2937' : 'transparent', color: activeTab === tab.key ? '#e6edf3' : '#8b949e', fontSize: '14px', fontWeight: activeTab === tab.key ? '600' : '400', borderLeft: `3px solid ${activeTab === tab.key ? '#58a6ff' : 'transparent'}`, transition: 'all 0.15s' }}>
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid #30363d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #7c3aed, #2ea043)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: 'white', flexShrink: 0 }}>
              {user?.name?.charAt(0)}
            </div>
            <div>
              <div style={{ color: '#e6edf3', fontSize: '13px', fontWeight: '600' }}>{user?.name}</div>
              <div style={{ color: '#484f58', fontSize: '11px' }}>👑 Admin</div>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem('user'); window.location.href = '/' }}
            style={{ width: '100%', background: '#21262d', border: '1px solid #30363d', color: '#8b949e', padding: '7px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
            লগআউট
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: '240px', padding: '32px', minHeight: '100vh' }}>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ color: '#e6edf3', fontWeight: '800', fontSize: '24px', margin: '0 0 4px' }}>Dashboard</h1>
              <p style={{ color: '#8b949e', fontSize: '14px', margin: 0 }}>LeapBangladesh এর সামগ্রিক চিত্র</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {stats.map((stat, i) => (
                <div key={i} style={{ ...card, padding: '20px' }}>
                  <span style={{ fontSize: '24px' }}>{stat.icon}</span>
                  <div style={{ color: stat.color, fontSize: '28px', fontWeight: '800', margin: '12px 0 4px' }}>{stat.value}</div>
                  <div style={{ color: '#c9d1d9', fontSize: '13px', fontWeight: '600' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px' }}>
              <div style={{ ...card, padding: '20px' }}>
                <h3 style={{ color: '#e6edf3', fontWeight: '700', margin: '0 0 16px', fontSize: '15px' }}>সাম্প্রতিক ইউজার</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #21262d' }}>
                      {['নাম', 'ইমেইল', 'পয়েন্ট', 'Role'].map(h => (
                        <th key={h} style={{ color: '#8b949e', fontSize: '11px', fontWeight: '600', textAlign: 'left', padding: '8px 0', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 5).map((u, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #21262d' }}>
                        <td style={{ padding: '12px 0', color: '#e6edf3', fontSize: '14px', fontWeight: '600' }}>{u.name}</td>
                        <td style={{ padding: '12px 0', color: '#8b949e', fontSize: '13px' }}>{u.email}</td>
                        <td style={{ padding: '12px 0', color: '#f0c000', fontSize: '14px', fontWeight: '700' }}>{u.points}</td>
                        <td style={{ padding: '12px 0' }}>
                          <span style={{ background: u.role === 'admin' ? '#1f1035' : '#0d2818', color: u.role === 'admin' ? '#a371f7' : '#3fb950', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                            {u.role === 'admin' ? '👑 Admin' : '🎓 Student'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ ...card, padding: '20px' }}>
                  <h3 style={{ color: '#e6edf3', fontWeight: '700', margin: '0 0 14px', fontSize: '15px' }}>Quick Actions</h3>
                  {[
                    { label: '+ নতুন কোর্স যোগ', color: '#7c3aed', action: () => setActiveTab('courses') },
                    { label: '+ নতুন মিশন', color: '#f78166', action: () => setActiveTab('missions') },
                    { label: '👥 সব ইউজার দেখুন', color: '#58a6ff', action: () => setActiveTab('users') },
                    { label: '🪙 কয়েন দিন', color: '#f0c000', action: () => setActiveTab('coins') },
                  ].map((btn, i) => (
                    <button key={i} onClick={btn.action}
                      style={{ width: '100%', background: btn.color + '22', border: `1px solid ${btn.color}44`, color: btn.color, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', marginBottom: '8px', textAlign: 'left' }}>
                      {btn.label}
                    </button>
                  ))}
                </div>
                <div style={{ ...card, padding: '20px' }}>
                  <h3 style={{ color: '#e6edf3', fontWeight: '700', margin: '0 0 14px', fontSize: '15px' }}>সিস্টেম স্ট্যাটাস</h3>
                  {[
                    { label: 'Website', status: 'Online', color: '#3fb950' },
                    { label: 'Database', status: 'Healthy', color: '#3fb950' },
                    { label: 'API', status: 'Active', color: '#3fb950' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i < 2 ? '10px' : 0 }}>
                      <span style={{ color: '#8b949e', fontSize: '13px' }}>{item.label}</span>
                      <span style={{ color: item.color, fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h1 style={{ color: '#e6edf3', fontWeight: '800', fontSize: '24px', margin: '0 0 4px' }}>ইউজার ম্যানেজমেন্ট</h1>
            <p style={{ color: '#8b949e', fontSize: '14px', margin: '0 0 24px' }}>মোট {users.length} জন ইউজার</p>

            {userActionMsg && (
              <div style={{ background: userActionMsg.startsWith('✅') ? '#0d2818' : '#2a0a00', border: `1px solid ${userActionMsg.startsWith('✅') ? '#2ea04344' : '#f7816644'}`, color: userActionMsg.startsWith('✅') ? '#3fb950' : '#f78166', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {userActionMsg}
                <button onClick={() => setUserActionMsg('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' }}>✕</button>
              </div>
            )}

            <div style={{ ...card, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0d1117', borderBottom: '1px solid #30363d' }}>
                    {['নাম', 'ইমেইল', 'পয়েন্ট', 'Role', 'Status', 'Action'].map(h => (
                      <th key={h} style={{ color: '#8b949e', fontSize: '11px', fontWeight: '600', textAlign: 'left', padding: '12px 16px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #21262d', opacity: u.is_banned ? 0.6 : 1 }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', background: u.is_banned ? '#2a0a00' : 'linear-gradient(135deg, #7c3aed, #2ea043)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: 'white', flexShrink: 0 }}>
                            {u.name?.charAt(0)}
                          </div>
                          <span style={{ color: '#e6edf3', fontSize: '14px', fontWeight: '600' }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#8b949e', fontSize: '13px' }}>{u.email}</td>
                      <td style={{ padding: '14px 16px', color: '#f0c000', fontWeight: '700' }}>{u.points}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: u.role === 'admin' ? '#1f1035' : '#0d2818', color: u.role === 'admin' ? '#a371f7' : '#3fb950', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                          {u.role === 'admin' ? '👑 Admin' : '🎓 Student'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: u.is_banned ? '#2a0a00' : '#0d2818', color: u.is_banned ? '#f78166' : '#3fb950', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                          {u.is_banned ? '🚫 Banned' : '✅ Active'}
                        </span>
                        {u.is_banned && u.ban_reason && (
                          <div style={{ color: '#484f58', fontSize: '10px', marginTop: '2px' }}>{u.ban_reason}</div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {u.role !== 'admin' && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {u.is_banned ? (
                              <button
                                onClick={() => manageUser('unban', u.id, u.name)}
                                disabled={actionLoading === u.id}
                                style={{ background: '#0d2818', border: '1px solid #3fb95044', color: '#3fb950', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', opacity: actionLoading === u.id ? 0.5 : 1 }}>
                                ✅ Unban
                              </button>
                            ) : (
                              <button
                                onClick={() => manageUser('ban', u.id, u.name)}
                                disabled={actionLoading === u.id}
                                style={{ background: '#2a0a00', border: '1px solid #f7816644', color: '#f78166', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', opacity: actionLoading === u.id ? 0.5 : 1 }}>
                                🚫 Ban
                              </button>
                            )}
                            <button
                              onClick={() => manageUser('reset', u.id, u.name)}
                              disabled={actionLoading === u.id}
                              style={{ background: '#1a1000', border: '1px solid #f0c00044', color: '#f0c000', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', opacity: actionLoading === u.id ? 0.5 : 1 }}>
                              🔄 Reset
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ color: '#e6edf3', fontWeight: '800', fontSize: '24px', margin: '0 0 4px' }}>কোর্স ম্যানেজমেন্ট</h1>
                <p style={{ color: '#8b949e', fontSize: '14px', margin: 0 }}>মোট {courses.length} টি কোর্স</p>
              </div>
              <button onClick={openNewCourseModal} style={{ background: '#7c3aed', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
                + নতুন কোর্স
              </button>
            </div>

            {courses.length === 0 ? (
              <div style={{ ...card, padding: '40px', textAlign: 'center', color: '#484f58' }}>এখনো কোনো কোর্স যোগ করা হয়নি</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {courses.map((course) => (
                  <div key={course.id} style={{ ...card, padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h3 style={{ color: '#e6edf3', fontWeight: '700', margin: 0, fontSize: '15px' }}>{course.icon} {course.title}</h3>
                      <span style={{ background: course.is_published ? '#0d2818' : '#1a1a2e', color: course.is_published ? '#3fb950' : '#8b949e', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                        {course.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p style={{ color: '#8b949e', fontSize: '13px', margin: '0 0 12px' }}>{course.description}</p>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#8b949e', fontSize: '13px' }}>📖 {course.lessons} lessons</span>
                      {course.level && <span style={{ color: '#8b949e', fontSize: '13px' }}>🎯 {course.level}</span>}
                      <span style={{ color: course.is_paid ? '#f0c000' : '#3fb950', fontSize: '13px' }}>{course.is_paid ? `৳${course.price}` : 'ফ্রি'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      {course.coin_reward > 0 && <span style={{ background: '#f0c00020', color: '#f0c000', fontSize: '11px', padding: '2px 8px', borderRadius: '6px' }}>🪙 +{course.coin_reward}</span>}
                      {course.diamond_reward > 0 && <span style={{ background: '#22d3ee20', color: '#22d3ee', fontSize: '11px', padding: '2px 8px', borderRadius: '6px' }}>💎 +{course.diamond_reward}</span>}
                    </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href={`/admin/lessons/${course.id}`}
                      style={{ flex: 1, background: '#0d2818', border: '1px solid #3fb95044', color: '#3fb950', padding: '7px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textDecoration: 'none', textAlign: 'center' }}>
                      📖 Lessons
                    </Link>
                    <button onClick={() => openEditCourseModal(course)}
                      style={{ flex: 1, background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', padding: '7px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                      এডিট
                    </button>
                    <button onClick={() => togglePublishCourse(course)}
                      style={{ flex: 1, background: course.is_published ? '#2a0a00' : '#0d2818', border: `1px solid ${course.is_published ? '#f7816644' : '#3fb95044'}`, color: course.is_published ? '#f78166' : '#3fb950', padding: '7px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                      {course.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button onClick={() => deleteCourse(course)}
                      style={{ background: '#2a0a00', border: '1px solid #f7816644', color: '#f78166', padding: '7px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                      🗑️
                    </button>
                  </div>
              </div>
            ))}
              </div>
            )}
          </div>
        )}
        {/* Missions Tab */}
        {activeTab === 'missions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ color: '#e6edf3', fontWeight: '800', fontSize: '24px', margin: '0 0 4px' }}>মিশন ম্যানেজমেন্ট</h1>
                <p style={{ color: '#8b949e', fontSize: '14px', margin: 0 }}>মোট {missions.length} টি মিশন</p>
              </div>
              <button onClick={openNewMissionModal} style={{ background: '#f78166', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
                + নতুন মিশন
              </button>
            </div>

            {missions.length === 0 ? (
              <div style={{ ...card, padding: '40px', textAlign: 'center', color: '#484f58' }}>এখনো কোনো মিশন যোগ করা হয়নি</div>
            ) : (
              missions.map((mission) => {
                const missionRegs = registrations.filter(r => r.mission_id === mission.id)
                return (
                  <div key={mission.id} style={{ ...card, padding: '24px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div>
                        <h3 style={{ color: '#e6edf3', fontWeight: '700', margin: '0 0 4px', fontSize: '18px' }}>{mission.title}</h3>
                        <p style={{ color: '#8b949e', fontSize: '13px', margin: '0 0 8px' }}>{mission.description}</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {mission.coin_reward > 0 && <span style={{ background: '#f0c00020', color: '#f0c000', fontSize: '11px', padding: '2px 8px', borderRadius: '6px' }}>🪙 +{mission.coin_reward}</span>}
                          {mission.diamond_reward > 0 && <span style={{ background: '#22d3ee20', color: '#22d3ee', fontSize: '11px', padding: '2px 8px', borderRadius: '6px' }}>💎 +{mission.diamond_reward}</span>}
                        </div>
                      </div>
                      <span style={{ background: mission.is_active ? '#0d2818' : '#1a1a2e', color: mission.is_active ? '#3fb950' : '#8b949e', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        {mission.is_active ? '🟢 Active' : '⚪ Inactive'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                      {[
                        { label: 'নিবন্ধিত', value: missionRegs.length.toString(), color: '#58a6ff' },
                        { label: 'সর্বোচ্চ', value: mission.max_participants?.toString() || '-', color: '#8b949e' },
                        { label: 'পুরস্কার', value: `৳${mission.prize_amount || 0}`, color: '#f0c000' },
                        { label: 'শুরু', value: mission.start_date ? new Date(mission.start_date).toLocaleDateString('bn-BD') : '-', color: '#f78166' },
                      ].map((s, i) => (
                        <div key={i} style={{ background: '#0d1117', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                          <div style={{ color: s.color, fontWeight: '800', fontSize: '20px' }}>{s.value}</div>
                          <div style={{ color: '#484f58', fontSize: '12px', marginTop: '4px' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => openEditMissionModal(mission)} style={{ background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>এডিট করুন</button>
                      <button onClick={() => toggleActiveMission(mission)} style={{ background: mission.is_active ? '#2a0a00' : '#0d2818', border: `1px solid ${mission.is_active ? '#f7816644' : '#3fb95044'}`, color: mission.is_active ? '#f78166' : '#3fb950', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                        {mission.is_active ? 'বন্ধ করুন' : 'চালু করুন'}
                      </button>
                    </div>
                  </div>
                )
              })
            )}

            <div style={{ ...card, padding: '24px' }}>
              <h3 style={{ color: '#e6edf3', fontWeight: '700', margin: '0 0 16px', fontSize: '15px' }}>নিবন্ধিত ব্যবহারকারী ({registrations.length})</h3>
              {registrations.length === 0 ? (
                <p style={{ color: '#484f58', fontSize: '13px', textAlign: 'center', padding: '20px' }}>এখনো কেউ নিবন্ধন করেননি</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #21262d' }}>
                      {['নাম', 'ইমেইল', 'ফোন', 'নিবন্ধনের তারিখ'].map(h => (
                        <th key={h} style={{ color: '#8b949e', fontSize: '11px', fontWeight: '600', textAlign: 'left', padding: '8px 0' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #21262d' }}>
                        <td style={{ padding: '10px 0', color: '#e6edf3', fontSize: '13px' }}>{r.name}</td>
                        <td style={{ padding: '10px 0', color: '#8b949e', fontSize: '13px' }}>{r.email}</td>
                        <td style={{ padding: '10px 0', color: '#8b949e', fontSize: '13px' }}>{r.phone || '-'}</td>
                        <td style={{ padding: '10px 0', color: '#484f58', fontSize: '12px' }}>{new Date(r.registered_at).toLocaleDateString('bn-BD')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Coins Tab */}
        {activeTab === 'coins' && (
          <div>
            <h1 style={{ color: '#e6edf3', fontWeight: '800', fontSize: '24px', margin: '0 0 24px' }}>কয়েন/ডায়মন্ড ম্যানেজমেন্ট</h1>
            <div style={{ ...card, padding: '24px', maxWidth: '500px' }}>
              <h3 style={{ color: '#e6edf3', fontWeight: '700', margin: '0 0 16px', fontSize: '15px' }}>ম্যানুয়ালি কয়েন/ডায়মন্ড দিন</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>ইউজার বেছে নিন</label>
                  <select value={coinUserId} onChange={e => setCoinUserId(e.target.value)} style={inputStyle}>
                    <option value="">-- ইউজার বেছে নিন --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>টাইপ</label>
                  <select value={coinType} onChange={e => setCoinType(e.target.value)} style={inputStyle}>
                    <option value="coins">🪙 কয়েন</option>
                    <option value="diamonds">💎 ডায়মন্ড</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>পরিমাণ</label>
                  <input type="number" value={coinAmount} onChange={e => setCoinAmount(e.target.value)} placeholder="যেমন: 100" style={inputStyle} />
                </div>
                <button onClick={giveCoinsManually} disabled={!coinUserId || !coinAmount}
                  style={{ background: '#238636', border: 'none', color: 'white', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', opacity: (!coinUserId || !coinAmount) ? 0.5 : 1 }}>
                  ✓ যোগ করুন
                </button>
                {coinMessage && (
                  <div style={{ background: '#0d2818', border: '1px solid #2ea04344', color: '#3fb950', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                    {coinMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h1 style={{ color: '#e6edf3', fontWeight: '800', fontSize: '24px', margin: '0 0 24px' }}>সেটিংস</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
              {[
                { title: 'সাইটের নাম', value: 'LeapBangladesh', type: 'text' },
                { title: 'সাইটের বিবরণ', value: 'বাংলাদেশের সেরা প্রোগ্রামিং শেখার প্ল্যাটফর্ম', type: 'text' },
                { title: 'যোগাযোগ ইমেইল', value: 'admin@leapbangladesh.com', type: 'email' },
              ].map((setting, i) => (
                <div key={i} style={{ ...card, padding: '20px' }}>
                  <label style={{ ...labelStyle, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{setting.title}</label>
                  <input defaultValue={setting.value} type={setting.type} style={{ ...inputStyle, padding: '10px 14px', fontSize: '14px' }} />
                </div>
              ))}
              <button style={{ background: '#238636', border: 'none', color: 'white', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', width: 'fit-content' }}>
                সেটিংস সংরক্ষণ
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Course Modal */}
      {courseModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ ...card, padding: '24px', width: '440px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: '#e6edf3', fontWeight: '700', margin: '0 0 18px', fontSize: '16px' }}>
              {editingCourse ? 'কোর্স এডিট করুন' : 'নতুন কোর্স যোগ করুন'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>টাইটেল *</label>
                <input value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>বিবরণ</label>
                <textarea value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>লেভেল</label>
                  <input value={courseForm.level} onChange={e => setCourseForm({ ...courseForm, level: e.target.value })} placeholder="Beginner" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>সময়কাল</label>
                  <input value={courseForm.duration} onChange={e => setCourseForm({ ...courseForm, duration: e.target.value })} placeholder="৪ সপ্তাহ" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>লেসন সংখ্যা</label>
                  <input type="number" value={courseForm.lessons} onChange={e => setCourseForm({ ...courseForm, lessons: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>আইকন (ইমোজি)</label>
                  <input value={courseForm.icon} onChange={e => setCourseForm({ ...courseForm, icon: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>মূল্য (৳)</label>
                  <input type="number" value={courseForm.price} onChange={e => setCourseForm({ ...courseForm, price: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>পেইড কোর্স?</label>
                  <select value={courseForm.is_paid ? 'yes' : 'no'} onChange={e => setCourseForm({ ...courseForm, is_paid: e.target.value === 'yes' })} style={inputStyle}>
                    <option value="no">না (ফ্রি)</option>
                    <option value="yes">হ্যাঁ (পেইড)</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>টপিকস (কমা দিয়ে আলাদা করুন)</label>
                <input value={courseForm.topics} onChange={e => setCourseForm({ ...courseForm, topics: e.target.value })} placeholder="Variables, Loops, Functions" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>গ্রেডিয়েন্ট কালার</label>
                  <select value={courseForm.color} onChange={e => setCourseForm({ ...courseForm, color: e.target.value })} style={inputStyle}>
                    <option value="from-purple-600 to-purple-800">বেগুনি</option>
                    <option value="from-blue-600 to-blue-800">নীল</option>
                    <option value="from-green-600 to-green-800">সবুজ</option>
                    <option value="from-yellow-600 to-yellow-800">হলুদ</option>
                    <option value="from-red-600 to-red-800">লাল</option>
                    <option value="from-cyan-600 to-cyan-800">সায়ান</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>ব্যাজ (ঐচ্ছিক)</label>
                  <input value={courseForm.badge} onChange={e => setCourseForm({ ...courseForm, badge: e.target.value })} placeholder="Most Popular" style={inputStyle} />
                </div>
              </div>
              {/* Reward ফিল্ড */}
              <div style={{ borderTop: '1px solid #30363d', paddingTop: '12px' }}>
                <label style={{ ...labelStyle, color: '#f0c000', marginBottom: '10px' }}>🎁 কোর্স শেষে পুরস্কার</label>
                {/* Coin Unlock Price */}
              <div style={{ borderTop: '1px solid #30363d', paddingTop: '12px' }}>
                <label style={{ ...labelStyle, color: '#58a6ff', marginBottom: '10px' }}>🔓 Coin দিয়ে Unlock</label>
                <div>
                  <label style={labelStyle}>🪙 কত Coin লাগবে? (0 = Coin দিয়ে unlock হবে না)</label>
                  <input type="number" value={courseForm.coin_unlock_price}
                    onChange={e => setCourseForm({ ...courseForm, coin_unlock_price: parseInt(e.target.value) || 0 })}
                    style={inputStyle} placeholder="যেমন: 500" />
                </div>
              </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>🪙 কয়েন</label>
                    <input type="number" value={courseForm.coin_reward}
                      onChange={e => setCourseForm({ ...courseForm, coin_reward: parseInt(e.target.value) || 0 })}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>💎 ডায়মন্ড</label>
                    <input type="number" value={courseForm.diamond_reward}
                      onChange={e => setCourseForm({ ...courseForm, diamond_reward: parseInt(e.target.value) || 0 })}
                      style={inputStyle} />
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setCourseModalOpen(false)} style={{ flex: 1, background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>বাতিল</button>
              <button onClick={saveCourse} style={{ flex: 1, background: '#238636', border: 'none', color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>সংরক্ষণ</button>
            </div>
          </div>
        </div>
      )}

      {/* Mission Modal */}
      {missionModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ ...card, padding: '24px', width: '440px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: '#e6edf3', fontWeight: '700', margin: '0 0 18px', fontSize: '16px' }}>
              {editingMission ? 'মিশন এডিট করুন' : 'নতুন মিশন যোগ করুন'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>টাইটেল *</label>
                <input value={missionForm.title} onChange={e => setMissionForm({ ...missionForm, title: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>বিবরণ</label>
                <textarea value={missionForm.description} onChange={e => setMissionForm({ ...missionForm, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>পুরস্কার (৳)</label>
                  <input type="number" value={missionForm.prize_amount} onChange={e => setMissionForm({ ...missionForm, prize_amount: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>সর্বোচ্চ অংশগ্রহণকারী</label>
                  <input type="number" value={missionForm.max_participants} onChange={e => setMissionForm({ ...missionForm, max_participants: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>শুরুর তারিখ</label>
                  <input type="date" value={missionForm.start_date} onChange={e => setMissionForm({ ...missionForm, start_date: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>শেষের তারিখ</label>
                  <input type="date" value={missionForm.end_date} onChange={e => setMissionForm({ ...missionForm, end_date: e.target.value })} style={inputStyle} />
                </div>
              </div>
              {/* Reward ফিল্ড */}
              <div style={{ borderTop: '1px solid #30363d', paddingTop: '12px' }}>
                <label style={{ ...labelStyle, color: '#f0c000', marginBottom: '10px' }}>🎁 রেজিস্ট্রেশনে পুরস্কার</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>🪙 কয়েন</label>
                    <input type="number" value={missionForm.coin_reward}
                      onChange={e => setMissionForm({ ...missionForm, coin_reward: parseInt(e.target.value) || 0 })}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>💎 ডায়মন্ড</label>
                    <input type="number" value={missionForm.diamond_reward}
                      onChange={e => setMissionForm({ ...missionForm, diamond_reward: parseInt(e.target.value) || 0 })}
                      style={inputStyle} />
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setMissionModalOpen(false)} style={{ flex: 1, background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>বাতিল</button>
              <button onClick={saveMission} style={{ flex: 1, background: '#238636', border: 'none', color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>সংরক্ষণ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}