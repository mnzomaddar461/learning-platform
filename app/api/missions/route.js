import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function GET() {
  try {
    const { data: missions, error } = await supabase
      .from('missions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const { data: regs } = await supabase
      .from('mission_registrations')
      .select('mission_id')

    const withCounts = (missions || []).map(m => ({
      ...m,
      registered_count: (regs || []).filter(r => r.mission_id === m.id).length
    }))

    return NextResponse.json({ missions: withCounts })
  } catch (error) {
    return NextResponse.json({ missions: [] })
  }
}