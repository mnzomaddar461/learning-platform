import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'
import { isUserBanned } from '../../lib/checkBan'

export async function POST(request) {
  try {
    const { userId, courseId } = await request.json()

    if (!userId || !courseId) {
      return NextResponse.json({ error: 'userId এবং courseId আবশ্যক' }, { status: 400 })
    }

    const banStatus = await isUserBanned(userId)
    if (banStatus.banned) {
      return NextResponse.json({ error: `আপনার অ্যাকাউন্ট ব্যান করা হয়েছে: ${banStatus.reason}` }, { status: 403 })
    }

    // Course info আনো
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, coin_unlock_price, is_paid')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'কোর্স পাওয়া যায়নি' }, { status: 404 })
    }

    // আগে enrolled কিনা চেক করো
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'ইতিমধ্যে এই কোর্সে enrolled আছেন' }, { status: 400 })
    }

    // User-এর coin balance চেক করো
    const { data: userCoins, error: coinError } = await supabase
      .from('user_coins')
      .select('coins')
      .eq('user_id', userId)
      .single()

    if (coinError || !userCoins) {
      return NextResponse.json({ error: 'কয়েন তথ্য পাওয়া যায়নি' }, { status: 404 })
    }

    const price = course.coin_unlock_price || 0

    if (userCoins.coins < price) {
      return NextResponse.json({
        error: `পর্যাপ্ত কয়েন নেই। দরকার: ${price}, আপনার আছে: ${userCoins.coins}`,
        required: price,
        current: userCoins.coins
      }, { status: 400 })
    }

    // Coin কাটো
    const { error: deductError } = await supabase
      .from('user_coins')
      .update({ coins: userCoins.coins - price, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (deductError) throw deductError

    // Transaction log করো
    await supabase
      .from('coin_transactions')
      .insert({
        user_id: userId,
        amount: -price,
        type: 'course_unlock',
        description: `course_${courseId}_unlocked`
      })

    // Enrollment তৈরি করো
    const { error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        progress: 0
      })

    if (enrollError) throw enrollError

    return NextResponse.json({
      success: true,
      message: `"${course.title}" সফলভাবে unlock হয়েছে!`,
      coinsSpent: price,
      remainingCoins: userCoins.coins - price
    })
  } catch (error) {
    console.error('Unlock error:', error)
    return NextResponse.json({ error: 'Unlock করা যায়নি' }, { status: 500 })
  }
}