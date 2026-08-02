import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { isUserBanned, isEmailBanned } from '../../lib/checkBan'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const missionId = searchParams.get('missionId')

    if (!email || !missionId) {
      return NextResponse.json({ registered: false })
    }

    const { data, error } = await supabase
      .from('mission_registrations')
      .select('id')
      .eq('email', email)
      .eq('mission_id', missionId)
      .limit(1)

    if (error) throw error

    return NextResponse.json({ registered: (data || []).length > 0 })
  } catch (error) {
    return NextResponse.json({ registered: false })
  }
}

export async function POST(request) {
  try {
    const { name, email, phone, mission_id, mission_name, userId } = await request.json()

    if (!name || !email || !mission_id) {
      return NextResponse.json({ error: 'নাম, ইমেইল এবং mission_id আবশ্যক' }, { status: 400 })
    }

    // ── ফোন নম্বর validation ──────────────────
    if (phone) {
      const digitsOnly = phone.replace(/[^0-9]/g, '')
      const phoneWithoutCode = phone.replace(/^\+\d{1,4}/, '').replace(/[^0-9]/g, '')

      if (!/^[0-9]+$/.test(phone.replace(/^\+\d{1,4}/, ''))) {
        return NextResponse.json({ error: 'ফোন নম্বরে শুধুমাত্র সংখ্যা থাকতে হবে' }, { status: 400 })
      }

      if (phoneWithoutCode.length < 7 || phoneWithoutCode.length > 12) {
        return NextResponse.json({ error: 'সঠিক ফোন নম্বর দিন (৭-১২ ডিজিট)' }, { status: 400 })
      }
    }

    // ── Ban চেক ──────────────────────────
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

    // ── Duplicate registration চেক ──────────────
    const { data: existing, error: checkError } = await supabase
      .from('mission_registrations')
      .select('id')
      .eq('email', email)
      .eq('mission_id', mission_id)
      .limit(1)

    if (checkError) throw checkError

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'আপনি ইতিমধ্যে এই মিশনে রেজিস্ট্রেশন করেছেন' }, { status: 400 })
    }

    // ── Registration তৈরি করো ──────────────
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