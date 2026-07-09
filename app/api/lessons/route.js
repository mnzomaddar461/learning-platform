import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    if (!courseId) return NextResponse.json({ lessons: [] })

    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })

    if (error) throw error
    return NextResponse.json({ lessons: data || [] })
  } catch (error) {
    return NextResponse.json({ lessons: [] })
  }
}