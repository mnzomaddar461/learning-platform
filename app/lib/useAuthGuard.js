'use client'
import { useEffect } from 'react'

export function useAuthGuard() {
  useEffect(() => {
    const saved = localStorage.getItem('user')
    if (!saved) return

    const u = JSON.parse(saved)
    fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: u.id })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.valid && data.banned) {
          localStorage.removeItem('user')
          alert(`আপনার অ্যাকাউন্ট ব্যান করা হয়েছে। কারণ: ${data.reason}`)
          window.location.href = '/login'
        }
      })
      .catch(() => {}) // নেটওয়ার্ক এরর হলে সাইলেন্টলি ignore
  }, [])
}