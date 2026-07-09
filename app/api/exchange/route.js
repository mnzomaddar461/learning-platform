import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function POST(request) {
  try {
    const { userId, diamonds } = await request.json()

    if (!userId || !diamonds) {
      return NextResponse.json({ error: 'userId এবং diamonds আবশ্যক' }, { status: 400 })
    }

    if (diamonds % 10 !== 0) {
      return NextResponse.json({ error: 'Diamond অবশ্যই ১০ এর গুণিতক হতে হবে' }, { status: 400 })
    }

    // Current balance আনো
    const { data: userCoins, error: coinError } = await supabase
      .from('user_coins')
      .select('coins, diamonds')
      .eq('user_id', userId)
      .single()

    if (coinError || !userCoins) {
      return NextResponse.json({ error: 'ব্যালেন্স পাওয়া যায়নি' }, { status: 404 })
    }

    // Minimum 50 diamonds চেক
    if (userCoins.diamonds < 50) {
      return NextResponse.json({
        error: `Exchange করতে minimum ৫০ diamond লাগবে। আপনার আছে: ${userCoins.diamonds}`,
        current_diamonds: userCoins.diamonds
      }, { status: 400 })
    }

    // পর্যাপ্ত diamond আছে কিনা চেক
    if (userCoins.diamonds < diamonds) {
      return NextResponse.json({
        error: `পর্যাপ্ত diamond নেই। আপনার আছে: ${userCoins.diamonds}`,
        current_diamonds: userCoins.diamonds
      }, { status: 400 })
    }

    const coinsToAdd = (diamonds / 10) * 30
    const newDiamonds = userCoins.diamonds - diamonds
    const newCoins = userCoins.coins + coinsToAdd

    // Balance আপডেট
    const { error: updateError } = await supabase
      .from('user_coins')
      .update({
        diamonds: newDiamonds,
        coins: newCoins,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) throw updateError

    // Transaction log
    await supabase.from('coin_transactions').insert([
      {
        user_id: userId,
        amount: -diamonds,
        type: 'diamond_exchange',
        description: `${diamonds} diamond → ${coinsToAdd} coin`
      },
      {
        user_id: userId,
        amount: coinsToAdd,
        type: 'diamond_exchange',
        description: `diamond exchange থেকে ${coinsToAdd} coin`
      }
    ])

    return NextResponse.json({
      success: true,
      message: `✅ ${diamonds} 💎 → ${coinsToAdd} 🪙 exchange সফল!`,
      diamonds_spent: diamonds,
      coins_received: coinsToAdd,
      new_diamonds: newDiamonds,
      new_coins: newCoins
    })
  } catch (error) {
    console.error('Exchange error:', error)
    return NextResponse.json({ error: 'Exchange করা যায়নি' }, { status: 500 })
  }
}