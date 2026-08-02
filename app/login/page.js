'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'লগইন ব্যর্থ হয়েছে')
      } else {
        localStorage.setItem('user', JSON.stringify(data.user))
        window.location.href = '/dashboard'
      }
    } catch (err) {
      setError('কিছু একটা ভুল হয়েছে, আবার চেষ্টা করুন')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            {/* <span className="text-3xl"></span> */}
            <span className="text-white font-bold text-2xl">LeapBangladesh</span>
          </Link>
          <p className="text-gray-400 mt-3">আপনার অ্যাকাউন্টে লগইন করুন</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 text-red-400 px-4 py-3 rounded-xl text-sm mb-6">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-gray-300 text-sm font-medium block mb-2">
                ইমেইল
              </label>
              <input
                type="email"
                required
                placeholder="আপনার ইমেইল দিন"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 px-4 py-3 rounded-xl outline-none focus:border-purple-600 transition"
              />
            </div>

            <div>
              <label className="text-gray-300 text-sm font-medium block mb-2">
                পাসওয়ার্ড
              </label>
              <input
                type="password"
                required
                placeholder="আপনার পাসওয়ার্ড দিন"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 px-4 py-3 rounded-xl outline-none focus:border-purple-600 transition"
              />
              <div className="text-right mt-2">
                <a href="#" className="text-purple-400 hover:text-purple-300 text-sm transition">
                  পাসওয়ার্ড ভুলে গেছেন?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition"
            >
              {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-600 text-sm">অথবা</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Register link */}
          <p className="text-center text-gray-400 text-sm">
            অ্যাকাউন্ট নেই?{' '}
            <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition">
              এখনই রেজিস্ট্রেশন করুন
            </Link>
          </p>
        </div>

        {/* Back */}
        <div className="text-center mt-6">
          <Link href="/" className="text-gray-600 hover:text-gray-400 text-sm transition">
            ← হোমে ফিরে যান
          </Link>
        </div>

      </div>
    </div>
  )
}