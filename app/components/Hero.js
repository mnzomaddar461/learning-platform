'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Hero() {
  const [count, setCount] = useState({ students: 0, courses: 0, missions: 0 })

useEffect(() => {
    Promise.all([
      fetch('/api/courses').then(r => r.json()),
      fetch('/api/missions').then(r => r.json()),
      fetch('/api/admin/users').then(r => r.json()),
    ]).then(([coursesData, missionsData, usersData]) => {
      const realCourses = (coursesData.courses || []).length
      const realMissions = (missionsData.missions || []).length
      const realStudents = (usersData.users || []).length

      const targets = {
        students: Math.max(realStudents, 1),
        courses: Math.max(realCourses, 1),
        missions: Math.max(realMissions, 1)
      }

      const duration = 2000
      const steps = 60
      const interval = duration / steps
      let current = { students: 0, courses: 0, missions: 0 }

      const timer = setInterval(() => {
        current = {
          students: Math.min(current.students + Math.ceil(targets.students / steps), targets.students),
          courses: Math.min(current.courses + Math.ceil(targets.courses / steps), targets.courses),
          missions: Math.min(current.missions + Math.ceil(targets.missions / steps), targets.missions),
        }
        setCount({ ...current })
        if (current.students >= targets.students) clearInterval(timer)
      }, interval)

      return () => clearInterval(timer)
    })
  }, [])

  return (
    <section className="bg-gray-950 min-h-screen flex items-center justify-center px-6 pt-24">
      <div className="max-w-5xl mx-auto text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-purple-900/40 border border-purple-700/50 text-purple-300 px-4 py-2 rounded-full text-sm mb-8">
          <span>🔥</span>
          <span>বাংলাদেশের সেরা প্রোগ্রামিং শেখার প্ল্যাটফর্ম</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
          কোর্স, প্র্যাকটিস ও{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            রিয়েল মিশনে
          </span>
          {' '}শিখুন প্রোগ্রামিং
        </h1>

        {/* Subtitle */}
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          গল্পভিত্তিক কোর্স, ইন্টারেক্টিভ কোড ল্যাব এবং রোমাঞ্চকর মিশনের মাধ্যমে 
          প্রোগ্রামিং শিখুন — সম্পূর্ণ বাংলায়।
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/courses" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition w-full sm:w-auto text-center">
            🎓 শেখা শুরু করুন
          </Link>
          <Link href="/mission" className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition border border-gray-700 w-full sm:w-auto text-center">
            🚀 Mission: Earthbound দেখুন
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-3xl font-bold text-white">{count.students.toLocaleString()}+</div>
            <div className="text-gray-400 text-sm mt-1">শিক্ষার্থী</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-3xl font-bold text-white">{count.courses}+</div>
            <div className="text-gray-400 text-sm mt-1">কোর্স</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-3xl font-bold text-white">{count.missions}+</div>
            <div className="text-gray-400 text-sm mt-1">মিশন</div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 flex flex-col items-center gap-2 text-gray-600">
          <span className="text-sm">নিচে স্ক্রোল করুন</span>
          <div className="animate-bounce text-xl">↓</div>
        </div>

      </div>
    </section>
  )
}