import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLocation } from "wouter"
import { signInWithGoogle } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { SiGoogle } from "react-icons/si"

export default function LandingPage() {
  const [, navigate] = useLocation()
  const { toast } = useToast()

  const handleGuestStart = () => {
    navigate('/form')
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Sign in error:', error)
      toast({
        title: "エラー",
        description: "ログインに失敗しました",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            YOXO Fes<br />
            <span className="text-xl font-normal">疲労測定システム</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
          >
            <SiGoogle className="mr-2 h-4 w-4" />
            Googleでログイン
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                または
              </span>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={handleGuestStart}
          >
            ゲストとして測定を開始
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}