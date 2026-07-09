'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Courses() {
  const [courses, setCourses] = useState([])

  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => setCourses((data.courses || []).slice(0, 4)))
  }, [])

  return (
    <section className="bg-gray-900 py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-900/40 border border-purple-700/50 text-purple-300 px-4 py-2 rounded-full text-sm mb-6">
            <span>📚</span><span>আমাদের কোর্সসমূহ</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">আপনার পছন্দের কোর্স বেছে নিন</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">সম্পূর্ণ বাংলায়, গল্পের ছলে শিখুন।</p>
        </div>

        {courses.length === 0 ? (
          <div className="text-center text-gray-500 py-10">কোর্স লোড হচ্ছে...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course: any) => (
              <div key={course.id}
                className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden hover:border-purple-600 transition-all duration-300 hover:-translate-y-1 flex flex-col">
                <div className={`bg-gradient-to-br ${course.color || 'from-purple-600 to-purple-800'} p-6 relative`}>
                  <span className="text-4xl">{course.icon}</span>
                  <span className={`absolute top-4 left-4 text-xs font-bold px-2 py-1 rounded-full ${
                    course.is_paid ? 'bg-yellow-400 text-gray-900' : 'bg-green-400 text-gray-900'
                  }`}>
                    {course.is_paid ? `৳${course.price}` : 'FREE'}
                  </span>
                  {course.badge && (
                    <span className={`absolute top-4 right-4 text-xs font-semibold px-2 py-1 rounded-full ${
                      course.badge === 'Coming Soon' ? 'bg-gray-900/60 text-gray-300' : 'bg-white/20 text-white'
                    }`}>
                      {course.badge}
                    </span>
                  )}
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-white font-bold text-lg mb-2">{course.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 flex-1">{course.description}</p>
                  <div className="flex items-center gap-3 mb-4">
                    {course.level && (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        course.level === 'Beginner' ? 'bg-green-900/50 text-green-400' :
                        course.level === 'Intermediate' ? 'bg-orange-900/50 text-orange-400' :
                        'bg-red-900/50 text-red-400'
                      }`}>{course.level}</span>
                    )}
                    {course.duration && <span className="text-gray-500 text-xs">⏱ {course.duration}</span>}
                    <span className="text-gray-500 text-xs">📖 {course.lessons}</span>
                  </div>
                  {course.coin_reward > 0 && (
                    <div className="mb-4">
                      <span className="text-yellow-400 text-xs font-semibold bg-yellow-400/10 px-2 py-1 rounded-full">🪙 +{course.coin_reward} কয়েন</span>
                    </div>
                  )}
                  <Link href={`/courses/${course.id}`}
                    className={`w-full py-3 rounded-xl font-semibold text-sm text-center block transition ${
                      course.is_paid
                        ? 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}>
                    {course.is_paid ? `💎 ৳${course.price} — কিনুন` : '🎓 ফ্রি শুরু করুন →'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link href="/courses" className="border border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white px-6 py-3 rounded-xl transition font-medium">
            সব কোর্স দেখুন
          </Link>
        </div>
      </div>
    </section>
  )
}