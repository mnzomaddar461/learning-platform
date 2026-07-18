import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request) {
  try {
    const { action, userId, reason } = await request.json()
    if (!userId || !action) {
      return NextResponse.json({ error: 'userId এবং action আবশ্যক' }, { status: 400 })
    }

    switch (action) {

      // ── Ban ──────────────────────────────────────
      case 'ban': {
        const { error } = await supabase
          .from('users')
          .update({ is_banned: true, ban_reason: reason || 'Admin কর্তৃক ban করা হয়েছে' })
          .eq('id', userId)
        if (error) throw error
        return NextResponse.json({ success: true, message: 'User ban করা হয়েছে' })
      }

      // ── Unban ────────────────────────────────────
      case 'unban': {
        const { error } = await supabase
          .from('users')
          .update({ is_banned: false, ban_reason: null })
          .eq('id', userId)
        if (error) throw error
        return NextResponse.json({ success: true, message: 'User unban করা হয়েছে' })
      }

      // ── Reset ────────────────────────────────────
      case 'reset': {
        // Points reset
        await supabase
          .from('users')
          .update({ points: 0 })
          .eq('id', userId)

        // Coins reset
        await supabase
          .from('user_coins')
          .update({ coins: 0, diamonds: 0 })
          .eq('user_id', userId)

        // Progress reset
        await supabase
          .from('enrollments')
          .delete()
          .eq('user_id', userId)

        // Coin transactions reset
        await supabase
          .from('coin_transactions')
          .delete()
          .eq('user_id', userId)

        // Badges reset
        await supabase
          .from('users')
          .update({ badges: [] })
          .eq('id', userId)

        return NextResponse.json({ success: true, message: 'Account সম্পূর্ণ reset করা হয়েছে' })
      }

      default:
        return NextResponse.json({ error: 'অজানা action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Manage user error:', error)
    return NextResponse.json({ error: 'সমস্যা হয়েছে' }, { status: 500 })
  }
}