'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('পাসওয়ার্ড দুটো মিলছে না')
      return
    }

    if (form.password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে')
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('কিছু একটা ভুল হয়েছে, আবার চেষ্টা করুন')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-white text-2xl font-bold mb-3">রেজিস্ট্রেশন সফল!</h2>
          <p className="text-gray-400 mb-8">আপনার অ্যাকাউন্ট তৈরি হয়ে গেছে।</p>
          <Link
            href="/login"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition"
          >
            লগইন করুন
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            {/* <span className="text-3xl">🚀</span> */}
            <span className="text-white font-bold text-2xl">LeapBangladesh</span>
          </Link>
          <p className="text-gray-400 mt-3">নতুন অ্যাকাউন্ট তৈরি করুন</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 text-red-400 px-4 py-3 rounded-xl text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <div>
              <label className="text-gray-300 text-sm font-medium block mb-2">
                পূর্ণ নাম
              </label>
              <input
                type="text"
                required
                placeholder="আপনার নাম দিন"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 px-4 py-3 rounded-xl outline-none focus:border-purple-600 transition"
              />
            </div>

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="text-gray-300 text-sm font-medium block mb-2">
                পাসওয়ার্ড
              </label>
              <input
                type="password"
                required
                placeholder="কমপক্ষে ৬ অক্ষর"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 px-4 py-3 rounded-xl outline-none focus:border-purple-600 transition"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-gray-300 text-sm font-medium block mb-2">
                পাসওয়ার্ড নিশ্চিত করুন
              </label>
              <input
                type="password"
                required
                placeholder="পাসওয়ার্ড আবার দিন"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 px-4 py-3 rounded-xl outline-none focus:border-purple-600 transition"
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                required
                id="terms"
                className="mt-1 accent-purple-600"
              />
              <label htmlFor="terms" className="text-gray-400 text-sm">
                আমি{' '}
                <a href="#" className="text-purple-400 hover:text-purple-300">Terms of Service</a>
                {' '}এবং{' '}
                <a href="#" className="text-purple-400 hover:text-purple-300">Privacy Policy</a>
                {' '}এর সাথে একমত
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition"
            >
              {loading ? 'রেজিস্ট্রেশন হচ্ছে...' : 'রেজিস্ট্রেশন করুন'}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-gray-400 text-sm mt-6">
            আগে থেকেই অ্যাকাউন্ট আছে?{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition">
              লগইন করুন
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