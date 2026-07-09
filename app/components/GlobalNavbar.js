'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation'

export default function GlobalNavbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const router = useRouter()
  const pathname = usePathname()
  const [coins, setCoins] = useState(0)
  const [diamonds, setDiamonds] = useState(0)

useEffect(() => {
  const saved = localStorage.getItem('user')
  if (saved) {
    const u = JSON.parse(saved)
    setUser(u)
    fetch(`/api/coins?userId=${u.id}`)
      .then(res => res.json())
      .then(data => {
        setCoins(data.coins || 0)
        setDiamonds(data.diamonds || 0)
      })
  }
}, [pathname])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    router.push('/')
  }

  // Hide on these pages
  const hideOn = ['/admin']
  const shouldHide = hideOn.some(p => pathname?.startsWith(p))
  if (shouldHide) return null

  return (
    <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* <span className="text-2xl"></span> */}
          <span className="text-white font-bold text-xl">LeapBangladesh</span>
          {/* <Image 
          src="/LeapBangladesh.png" 
          alt="LeapBangladesh Logo" 
          width={70} 
          height={40}
          priority // Add this if it's above the fold
        /> */}
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-gray-300 hover:text-white transition text-sm">হোম</Link>
          <Link href="/courses" className="text-gray-300 hover:text-white transition text-sm">কোর্স</Link>
          <Link href="/practice" className="text-gray-300 hover:text-white transition text-sm">প্র্যাকটিস</Link>
          <Link href="/mission" className="text-gray-300 hover:text-white transition text-sm">মিশন</Link>
          <Link href="/leaderboard" className="text-gray-300 hover:text-white transition text-sm">লিডারবোর্ড</Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {/* Coins & Diamonds */}
              <div className="flex items-center gap-2 bg-gray-800/50 border border-gray-700 px-3 py-1.5 rounded-lg">
                <span className="flex items-center gap-1 text-yellow-400 text-sm font-semibold">
                  🪙 {coins}
                </span>
                <span className="text-gray-600">|</span>
                <span className="flex items-center gap-1 text-cyan-400 text-sm font-semibold">
                  💎 {diamonds}
                </span>
              </div>
          
              <Link href="/dashboard" className="text-gray-300 hover:text-white text-sm transition px-3 py-2">
                Dashboard
              </Link>
              <Link href="/profile" className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition">
                <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{user.name?.split(' ')[0]}</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-300 hover:text-white px-4 py-2 rounded-lg transition text-sm">
                লগইন
              </Link>
              <Link href="/register" className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg transition font-medium text-sm">
                শুরু করুন
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-white text-2xl" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden mt-4 pb-4 flex flex-col gap-3 border-t border-gray-800 pt-4">
          <Link href="/" className="text-gray-300 hover:text-white transition px-2 text-sm">হোম</Link>
          <Link href="/courses" className="text-gray-300 hover:text-white transition px-2 text-sm">কোর্স</Link>
          <Link href="/leaderboard" className="text-gray-300 hover:text-white transition text-sm">লিডারবোর্ড</Link>
          <Link href="/practice" className="text-gray-300 hover:text-white transition px-2 text-sm">প্র্যাকটিস</Link>
          <Link href="/mission" className="text-gray-300 hover:text-white transition px-2 text-sm">মিশন</Link>
          
          {user ? (
            <>
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition px-2 text-sm">Dashboard</Link>
              <Link href="/profile" className="text-gray-300 hover:text-white transition px-2 text-sm">প্রোফাইল</Link>
              <button onClick={handleLogout} className="bg-gray-800 text-gray-300 px-5 py-2 rounded-lg w-full text-left text-sm">লগআউট</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-300 hover:text-white transition px-2 text-sm">লগইন</Link>
              <Link href="/register" className="bg-purple-600 text-white px-5 py-2 rounded-lg font-medium w-full text-center text-sm">শুরু করুন</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}