import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ certificates: [] })

    // Completed enrollments আনো
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select('course_id, completed_at, progress')
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })

    if (error) throw error
    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ certificates: [] })
    }

    // Course details আনো
    const courseIds = enrollments.map(e => e.course_id)
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, icon, color, level, duration')
      .in('id', courseIds)

    const certificates = enrollments.map(e => {
      const course = (courses || []).find(c => c.id === e.course_id)
      return {
        course_id: e.course_id,
        completed_at: e.completed_at,
        title: course?.title || '',
        icon: course?.icon || '📚',
        color: course?.color || 'from-purple-600 to-purple-800',
        level: course?.level || '',
        duration: course?.duration || '',
      }
    })

    return NextResponse.json({ certificates })
  } catch (error) {
    return NextResponse.json({ certificates: [] })
  }
}