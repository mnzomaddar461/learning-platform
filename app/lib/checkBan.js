// import { supabaseAdmin } from './supabaseAdmin'

// export async function isUserBanned(userId) {
//   console.log('🔍 checkBan called with userId:', userId)
//   if (!userId) {
//     console.log('🔍 No userId — skipping ban check')
//     return { banned: false }
//   }

//   const { data: user, error } = await supabaseAdmin
//     .from('users')
//     .select('is_banned, ban_reason')
//     .eq('id', userId)
//     .single()

//   console.log('🔍 Supabase result:', { user, error })

//   if (error || !user) return { banned: false }

//   return {
//     banned: user.is_banned || false,
//     reason: user.ban_reason || 'উল্লেখ নেই'
//   }
// }

import { supabaseAdmin } from './supabaseAdmin'

export async function isUserBanned(userId) {
  if (!userId) return { banned: false }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('is_banned, ban_reason')
    .eq('id', userId)
    .single()

  if (error || !user) return { banned: false }

  return {
    banned: user.is_banned || false,
    reason: user.ban_reason || 'উল্লেখ নেই'
  }
}

export async function isEmailBanned(email) {
  if (!email) return { banned: false }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('is_banned, ban_reason')
    .eq('email', email)
    .single()

  if (error || !user) return { banned: false }

  return {
    banned: user.is_banned || false,
    reason: user.ban_reason || 'উল্লেখ নেই'
  }
}