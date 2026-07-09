import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function POST(request) {
  try {
    const { userId, courseId, lessonIndex } = await request.json()

    const { data: existing } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (existing) {
      const newProgress = Math.max(existing.progress, lessonIndex + 1)
      await supabase
        .from('enrollments')
        .update({ progress: newProgress })
        .eq('user_id', userId)
        .eq('course_id', courseId)
    } else {
      await supabase
        .from('enrollments')
        .insert([{ user_id: userId, course_id: courseId, progress: lessonIndex + 1 }])
    }

    return NextResponse.json({ message: 'Progress saved' })
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const courseId = searchParams.get('courseId')

    if (!userId) return NextResponse.json({ progress: 0, enrollments: [] })

    // Single course progress
    if (courseId) {
      const { data } = await supabase
        .from('enrollments')
        .select('progress')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single()

      return NextResponse.json({ progress: data?.progress || 0 })
    }

    // সব enrolled courses (dashboard-এর জন্য)
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id, progress, enrolled_at')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ enrollments: [], enrolledCourseIds: [] })
    }

    // Course details আনো
    const courseIds = enrollments.map(e => e.course_id)
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, icon, color, lessons, level')
      .in('id', courseIds)

    // Lesson counts আনো (progress % বের করতে)
    const { data: lessonCounts } = await supabase
      .from('lessons')
      .select('course_id')
      .in('course_id', courseIds)

        const lessonCountMap = {}
    ;(lessonCounts || []).forEach((l) => {
      lessonCountMap[l.course_id] = (lessonCountMap[l.course_id] || 0) + 1
    })

    const enriched = enrollments.map(e => {
      const course = (courses || []).find((c) => c.id === e.course_id)
      const totalLessons = lessonCountMap[e.course_id] || course?.lessons || 1
      const progressPercent = Math.round((e.progress / totalLessons) * 100)
      return {
        course_id: e.course_id,
        progress: e.progress,
        progress_percent: Math.min(progressPercent, 100),
        total_lessons: totalLessons,
        enrolled_at: e.enrolled_at,
        title: course?.title || '',
        icon: course?.icon || '📚',
        color: course?.color || 'from-purple-600 to-purple-800',
        level: course?.level || '',
      }
    })

    return NextResponse.json({
      enrollments: enriched,
      enrolledCourseIds: courseIds
    })
  } catch (error) {
    return NextResponse.json({ progress: 0, enrollments: [], enrolledCourseIds: [] })
  }
}