import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function PATCH(request) {
  try {
    const { userId, skills } = await request.json()
    if (!userId) return NextResponse.json({ error: 'userId আবশ্যক' }, { status: 400 })

    const { data, error } = await supabase
      .from('users')
      .update({ skills })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, skills: data.skills })
  } catch (error) {
    return NextResponse.json({ error: 'আপডেট করা যায়নি' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ skills: [] })

    const { data, error } = await supabase
      .from('users')
      .select('skills')
      .eq('id', userId)
      .single()

    if (error) throw error
    return NextResponse.json({ skills: data?.skills || [] })
  } catch (error) {
    return NextResponse.json({ skills: [] })
  }
}