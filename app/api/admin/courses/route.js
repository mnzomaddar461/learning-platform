import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, description, level, duration, lessons, icon, is_published, price, is_paid, topics, color, badge, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ courses: data })
  } catch (error) {
    return NextResponse.json({ courses: [] })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { title, description, level, duration, lessons, icon, price, is_paid, topics, color, badge } = body

    if (!title) {
      return NextResponse.json({ error: 'টাইটেল আবশ্যক' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('courses')
      .insert({
        title,
        description: description || '',
        level: level || '',
        duration: duration || '',
        lessons: lessons || 0,
        icon: icon || '📚',
        is_published: false,
        price: price || 0,
        is_paid: is_paid || false,
        topics: topics || [],
        color: color || 'from-purple-600 to-purple-800',
        badge: badge || null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ course: data })
  } catch (error) {
    return NextResponse.json({ error: 'কোর্স তৈরি করা যায়নি' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID আবশ্যক' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ course: data })
  } catch (error) {
    return NextResponse.json({ error: 'কোর্স আপডেট করা যায়নি' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID আবশ্যক' }, { status: 400 })
    }

    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'কোর্স ডিলিট করা যায়নি' }, { status: 500 })
  }
}