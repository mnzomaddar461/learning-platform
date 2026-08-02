import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { isUserBanned, isEmailBanned } from '../../lib/checkBan'

export async function POST(request) {
  try {
    const { name, email, phone, mission_id, mission_name, userId } = await request.json()

    if (!name || !email || !mission_id) {
      return NextResponse.json({ error: 'নাম, ইমেইল এবং mission_id আবশ্যক' }, { status: 400 })
    }

    // ── Ban চেক (userId থাকলে সেটা দিয়ে, না থাকলে email দিয়ে) ──
    if (userId) {
      const banStatus = await isUserBanned(userId)
      if (banStatus.banned) {
        return NextResponse.json({ error: `আপনার অ্যাকাউন্ট ব্যান করা হয়েছে: ${banStatus.reason}` }, { status: 403 })
      }
    } else {
      const emailBanStatus = await isEmailBanned(email)
      if (emailBanStatus.banned) {
        return NextResponse.json({ error: `আপনার অ্যাকাউন্ট ব্যান করা হয়েছে: ${emailBanStatus.reason}` }, { status: 403 })
      }
    }

    const { data, error } = await supabase
      .from('mission_registrations')
      .insert([{
        name,
        email,
        phone: phone || null,
        mission_id,
        mission_name
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, registration: data })
  } catch (error) {
    console.error('Mission registration error:', error)
    return NextResponse.json({ error: 'রেজিস্ট্রেশন ব্যর্থ হয়েছে' }, { status: 500 })
  }
}