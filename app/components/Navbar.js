'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('user')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    router.push('/')
  }

  return (
    <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <span className="text-white font-bold text-xl">CodeQuest BD</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-gray-300 hover:text-white transition">হোম</Link>
          <Link href="/courses" className="text-gray-300 hover:text-white transition">কোর্স</Link>
          <Link href="/practice" className="text-gray-300 hover:text-white transition">প্র্যাকটিস</Link>
          <Link href="/mission" className="text-gray-300 hover:text-white transition">মিশন</Link>
        </div>

        {/* Right buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/profile"
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition">
                <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm">{user.name?.split(' ')[0]}</span>
              </Link>
              <Link href="/dashboard"
                className="text-gray-300 hover:text-white text-sm transition">
                Dashboard
              </Link>
              <button onClick={handleLogout}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition">
                লগআউট
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-300 hover:text-white px-4 py-2 transition">
                লগইন
              </Link>
              <Link href="/register"
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg transition font-medium">
                শুরু করুন
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-white text-2xl" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden mt-4 pb-4 flex flex-col gap-4 border-t border-gray-800 pt-4">
          <Link href="/" className="text-gray-300 hover:text-white transition px-2">হোম</Link>
          <Link href="/courses" className="text-gray-300 hover:text-white transition px-2">কোর্স</Link>
          <Link href="/practice" className="text-gray-300 hover:text-white transition px-2">প্র্যাকটিস</Link>
          <Link href="/mission" className="text-gray-300 hover:text-white transition px-2">মিশন</Link>
          {user ? (
            <>
              <Link href="/profile" className="text-gray-300 hover:text-white transition px-2">প্রোফাইল</Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition px-2">Dashboard</Link>
              <button onClick={handleLogout} className="bg-gray-800 text-gray-300 px-5 py-2 rounded-lg w-full text-left">লগআউট</button>
            </>
          ) : (
            <Link href="/register" className="bg-purple-600 text-white px-5 py-2 rounded-lg font-medium w-full text-center">
              শুরু করুন
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}