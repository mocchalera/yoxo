import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // 現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        syncUserWithBackend(session.user.id).catch(console.error)
      }
      setLoading(false)
    })

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user
      setUser(currentUser ?? null)
      setLoading(false)

      if (currentUser) {
        try {
          await syncUserWithBackend(currentUser.id)
        } catch (error) {
          console.error('Error syncing user:', error)
          toast({
            title: "エラー",
            description: "ユーザー情報の同期に失敗しました",
            variant: "destructive"
          })
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function syncUserWithBackend(supabaseId: string) {
    const response = await fetch('/api/auth/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        supabase_id: supabaseId,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to sync user data')
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}