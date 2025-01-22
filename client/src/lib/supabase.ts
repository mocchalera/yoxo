import { createClient } from '@supabase/supabase-js'
import { db } from '@db'
import { users } from '@db/schema'
import { eq } from 'drizzle-orm'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  username: string
  line_id?: string
  created_at: string
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/form`
    }
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Supabaseの認証状態変更をリッスンし、必要に応じてDBを更新
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    try {
      // ユーザーがすでに存在するか確認
      const existingUser = await db.query.users.findFirst({
        where: eq(users.supabase_id, session.user.id)
      })

      if (!existingUser) {
        // 新規ユーザーの場合、DBに追加
        await db.insert(users).values({
          supabase_id: session.user.id,
          created_at: new Date()
        })
      }
    } catch (error) {
      console.error('Error syncing user data:', error)
    }
  }
})