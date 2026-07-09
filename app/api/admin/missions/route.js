import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('missions')
      .select('id, title, description, prize_amount, max_participants, start_date, end_date, is_active, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ missions: data })
  } catch (error) {
    return NextResponse.json({ missions: [] })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { title, description, prize_amount, max_participants, start_date, end_date } = body

    if (!title) {
      return NextResponse.json({ error: 'টাইটেল আবশ্যক' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('missions')
      .insert({
        title,
        description: description || '',
        prize_amount: prize_amount || 0,
        max_participants: max_participants || 500,
        start_date: start_date || null,
        end_date: end_date || null,
        is_active: false
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ mission: data })
  } catch (error) {
    return NextResponse.json({ error: 'মিশন তৈরি করা যায়নি' }, { status: 500 })
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
      .from('missions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ mission: data })
  } catch (error) {
    return NextResponse.json({ error: 'মিশন আপডেট করা যায়নি' }, { status: 500 })
  }
}