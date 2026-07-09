import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const courseId = searchParams.get('courseId')

    if (!userId) return NextResponse.json({ enrolled: false })

    let query = supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', userId)

    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    const { data, error } = await query
    if (error) throw error

    if (courseId) {
      return NextResponse.json({ enrolled: (data || []).length > 0 })
    }

    return NextResponse.json({
      enrolledCourseIds: (data || []).map(e => e.course_id)
    })
  } catch (error) {
    return NextResponse.json({ enrolled: false, enrolledCourseIds: [] })
  }
}