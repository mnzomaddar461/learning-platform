import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) return NextResponse.json({ activity: [] })

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data } = await supabase
      .from('activity_log')
      .select('activity_date, count')
      .eq('user_id', userId)
      .gte('activity_date', sixMonthsAgo.toISOString().split('T')[0])

    return NextResponse.json({ activity: data || [] })
  } catch (error) {
    return NextResponse.json({ activity: [] })
  }
}