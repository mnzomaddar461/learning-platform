import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export async function POST(request) {
  try {
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ valid: false }, { status: 400 })
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('is_banned, ban_reason')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ valid: false }, { status: 404 })
    }

    if (user.is_banned) {
      return NextResponse.json({
        valid: false,
        banned: true,
        reason: user.ban_reason || 'উল্লেখ নেই'
      }, { status: 403 })
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}