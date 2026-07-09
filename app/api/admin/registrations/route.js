import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('mission_registrations')
      .select('*')
      .order('registered_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ registrations: data || [] })
  } catch (error) {
    return NextResponse.json({ registrations: [] })
  }
}