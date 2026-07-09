import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, points, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    const users = data.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      points: u.points || 0,
      joined: new Date(u.created_at).getFullYear().toString()
    }))

    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json({ users: [] })
  }
}