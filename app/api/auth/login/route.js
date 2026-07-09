import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '../../../lib/supabase'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'ইমেইল ও পাসওয়ার্ড দিন' },
        { status: 400 }
      )
    }

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { message: 'ইমেইল বা পাসওয়ার্ড ভুল' },
        { status: 401 }
      )
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return NextResponse.json(
        { message: 'ইমেইল বা পাসওয়ার্ড ভুল' },
        { status: 401 }
      )
    }

    // Create token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Set cookie
    const response = NextResponse.json(
      {
        message: 'লগইন সফল',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          points: user.points,
        }
      },
      { status: 200 }
    )

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response

  } catch (error) {
    return NextResponse.json(
      { message: 'কিছু একটা ভুল হয়েছে' },
      { status: 500 }
    )
  }
}