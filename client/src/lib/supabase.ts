import { createClient } from '@supabase/supabase-js'
import { db } from '@db'
import { users } from '@db/schema'
import { eq } from 'drizzle-orm'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabaseの環境変数が設定されていません。')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

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
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      redirectTo: `${window.location.origin}/form`
    }
  })

  if (error) throw error

  // ログイン成功後、ユーザー情報をバックエンドと同期
  if (data?.user) {
    try {
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supabase_id: data.user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync user data');
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
      // エラーが発生してもログインは続行
    }
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Supabaseの認証状態変更をリッスンし、必要に応じてDBを更新
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    try {
      // バックエンドと同期
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supabase_id: session.user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync user data');
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
    }
  }
});