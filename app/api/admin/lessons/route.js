import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

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

export async function POST(request) {
  try {
    const body = await request.json()
    const { course_id, title, video_id, content, duration, quiz_type, quiz_data, order_index } = body

    if (!course_id || !title) {
      return NextResponse.json({ error: 'course_id এবং title আবশ্যক' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('lessons')
      .insert({ course_id, title, video_id: video_id || '', content: content || '', duration: duration || '10 মিনিট', quiz_type: quiz_type || 'mcq', quiz_data: quiz_data || [], order_index: order_index || 0 })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ lesson: data })
  } catch (error) {
    return NextResponse.json({ error: 'Lesson তৈরি করা যায়নি' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'ID আবশ্যক' }, { status: 400 })

    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ lesson: data })
  } catch (error) {
    return NextResponse.json({ error: 'Lesson আপডেট করা যায়নি' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID আবশ্যক' }, { status: 400 })

    const { error } = await supabase.from('lessons').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Lesson ডিলিট করা যায়নি' }, { status: 500 })
  }
}