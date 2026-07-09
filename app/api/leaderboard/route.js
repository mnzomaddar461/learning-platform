import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('user_coins')
      .select('user_id, coins, diamonds')
      .order('coins', { ascending: false })

    if (error) throw error

    return NextResponse.json({ leaderboard: data || [] })
  } catch (error) {
    return NextResponse.json({ leaderboard: [] })
  }
}