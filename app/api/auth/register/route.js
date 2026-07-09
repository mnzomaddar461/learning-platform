import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '../../../lib/supabase'

export async function POST(request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'সব তথ্য পূরণ করুন' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { message: 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট আছে' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const { data, error } = await supabase
      .from('users')
      .insert([{ name, email, password: hashedPassword }])
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { message: 'রেজিস্ট্রেশন ব্যর্থ হয়েছে' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'রেজিস্ট্রেশন সফল হয়েছে', userId: data.id },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { message: 'কিছু একটা ভুল হয়েছে' },
      { status: 500 }
    )
  }
}