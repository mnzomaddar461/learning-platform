import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

const BADGE_DEFINITIONS = [
  { id: 'first_code', icon: '🔥', title: 'First Code', desc: 'প্রথম lesson complete করেছেন' },
  { id: 'speed_coder', icon: '⚡', title: 'Speed Coder', desc: '১ দিনে ৩টা lesson complete' },
  { id: 'perfect_score', icon: '🎯', title: 'Perfect Score', desc: 'Quiz-এ ১০০% পেয়েছেন' },
  { id: 'mission_hero', icon: '🏆', title: 'Mission Hero', desc: 'Mission-এ register করেছেন' },
  { id: 'course_master', icon: '📚', title: 'Course Master', desc: 'একটি course সম্পূর্ণ করেছেন' },
  { id: 'top_10', icon: '🌟', title: 'Top 10', desc: 'Leaderboard-এ top 10-এ আছেন' },
  { id: 'diamond_earner', icon: '💎', title: 'Diamond Earner', desc: '৫০+ diamond অর্জন করেছেন' },
  { id: 'coin_collector', icon: '🪙', title: 'Coin Collector', desc: '৫০০+ coin অর্জন করেছেন' },
]

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ badges: BADGE_DEFINITIONS.map(b => ({ ...b, earned: false })) })

    // User data আনো
    const { data: userData } = await supabase
      .from('users')
      .select('badges, points')
      .eq('id', userId)
      .single()

    const earnedIds = userData?.badges || []

    // Coin/Diamond balance আনো
    const { data: coinsData } = await supabase
      .from('user_coins')
      .select('coins, diamonds')
      .eq('user_id', userId)
      .single()

    // Enrollments আনো
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id, progress')
      .eq('user_id', userId)

    // Mission registrations আনো
    const { data: missionRegs } = await supabase
      .from('mission_registrations')
      .select('id')
      .eq('user_id', userId)

    // Activity log আনো (speed coder চেক করতে)
    const { data: activity } = await supabase
      .from('activity_log')
      .select('activity_date, count')
      .eq('user_id', userId)

    // Leaderboard check
    const { data: allCoins } = await supabase
      .from('user_coins')
      .select('user_id, coins')
      .order('coins', { ascending: false })
      .limit(10)

    const isTop10 = (allCoins || []).some(u => u.user_id === userId)

    // Badge conditions চেক
    const newEarned = new Set(earnedIds)

    // 🔥 First Code — কোনো enrollment আছে + progress > 0
    if ((enrollments || []).some(e => e.progress > 0)) newEarned.add('first_code')

    // ⚡ Speed Coder — ১ দিনে count >= 3
    if ((activity || []).some(a => a.count >= 3)) newEarned.add('speed_coder')

    // 🏆 Mission Hero — কোনো mission registration আছে
    if ((missionRegs || []).length > 0) newEarned.add('mission_hero')

    // 📚 Course Master — কোনো course-এর lesson সব complete (progress >= lessons count)
    for (const enrollment of (enrollments || [])) {
      const { data: lessonCount } = await supabase
        .from('lessons')
        .select('id', { count: 'exact' })
        .eq('course_id', enrollment.course_id)
      if (lessonCount && enrollment.progress >= (lessonCount.length || 1)) {
        newEarned.add('course_master')
        break
      }
    }

    // 🌟 Top 10
    if (isTop10) newEarned.add('top_10')

    // 💎 Diamond Earner — 50+ diamonds
    if ((coinsData?.diamonds || 0) >= 50) newEarned.add('diamond_earner')

    // 🪙 Coin Collector — 500+ coins
    if ((coinsData?.coins || 0) >= 500) newEarned.add('coin_collector')

    // DB-তে update করো নতুন badge থাকলে
    const newEarnedArray = Array.from(newEarned)
    if (newEarnedArray.length !== earnedIds.length) {
      await supabase
        .from('users')
        .update({ badges: newEarnedArray })
        .eq('id', userId)
    }

    const result = BADGE_DEFINITIONS.map(b => ({
      ...b,
      earned: newEarned.has(b.id)
    }))

    return NextResponse.json({ badges: result, earnedCount: newEarned.size })
  } catch (error) {
    console.error('Badge error:', error)
    return NextResponse.json({ badges: BADGE_DEFINITIONS.map(b => ({ ...b, earned: false })), earnedCount: 0 })
  }
}