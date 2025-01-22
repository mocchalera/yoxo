import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabaseの環境変数が設定されていません。')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// データ型の定義
export type Profile = {
  id: string
  username: string
  line_id?: string
  created_at: string
}

export type SurveyResponse = {
  id: string
  yoxo_id: string
  user_id: string
  section1_responses: Record<string, any>
  section2_responses: Record<string, any>
  section3_responses: Record<string, any>
  calculated_scores: Record<string, any>
  created_at: string
}

export type Message = {
  id: string
  user_id: string
  dify_message: string
  created_at: string
}

// 認証関連の関数
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

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error signing out:', error)
    return false
  }
}

// データベース操作関連の関数
export async function createProfile(userId: string, username: string, lineId?: string) {
  try {
    const { error } = await supabase
      .from('users')
      .insert([
        {
          supabase_id: userId,
          line_id: lineId,
          username: username
        }
      ])
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error creating profile:', error)
    return false
  }
}

export async function getProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('supabase_id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

// Supabaseの認証状態変更をリッスン
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    try {
      // プロフィールの存在確認
      const profile = await getProfile(session.user.id)
      if (!profile) {
        // プロフィールが存在しない場合は作成
        await createProfile(session.user.id, session.user.email || 'anonymous')
      }
    } catch (error) {
      console.error('Error syncing user data:', error)
    }
  }
});