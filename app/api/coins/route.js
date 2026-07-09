import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

// Get user's coin balance
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ coins: 0, diamonds: 0 })
    }

    const { data, error } = await supabase
      .from('user_coins')
      .select('coins, diamonds')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return NextResponse.json({ coins: 0, diamonds: 0 })
    }

    return NextResponse.json({ coins: data.coins, diamonds: data.diamonds })
  } catch (error) {
    return NextResponse.json({ coins: 0, diamonds: 0 })
  }
}

// Add coins (with reason — prevents duplicate awards)
export async function POST(request) {
  try {
    const { userId, amount, type, description } = await request.json()

    if (!userId || !amount || !type) {
      return NextResponse.json({ message: 'Missing data' }, { status: 400 })
    }

    // Check if this exact transaction already happened (prevent duplicate rewards)
    const { data: existing } = await supabase
      .from('coin_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('description', description)
      .single()

    if (existing) {
      // Already awarded — don't add again
      const { data: current } = await supabase
        .from('user_coins')
        .select('coins, diamonds')
        .eq('user_id', userId)
        .single()
      return NextResponse.json({
        coins: current?.coins || 0,
        diamonds: current?.diamonds || 0,
        alreadyAwarded: true
      })
    }

    // Get or create user_coins row
    const { data: existingCoins } = await supabase
      .from('user_coins')
      .select('*')
      .eq('user_id', userId)
      .single()

    let newCoins, newDiamonds
    const isDiamond = type === 'mission_complete'

    if (existingCoins) {
      newCoins = existingCoins.coins + (isDiamond ? 0 : amount)
      newDiamonds = existingCoins.diamonds + (isDiamond ? amount : 0)
      await supabase
        .from('user_coins')
        .update({ coins: newCoins, diamonds: newDiamonds, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    } else {
      newCoins = isDiamond ? 0 : amount
      newDiamonds = isDiamond ? amount : 0
      await supabase
        .from('user_coins')
        .insert([{ user_id: userId, coins: newCoins, diamonds: newDiamonds }])
    }

    // Log transaction
    await supabase
      .from('coin_transactions')
      .insert([{ user_id: userId, amount, type, description }])

    // Log daily activity (upsert)
    const today = new Date().toISOString().split('T')[0]
    const { data: existingActivity } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_date', today)
      .single()

    if (existingActivity) {
      await supabase
        .from('activity_log')
        .update({ count: existingActivity.count + 1 })
        .eq('user_id', userId)
        .eq('activity_date', today)
    } else {
      await supabase
        .from('activity_log')
        .insert([{ user_id: userId, activity_date: today, count: 1 }])
    }

    return NextResponse.json({ coins: newCoins, diamonds: newDiamonds })
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 })
  }
}