import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { signInWithGoogle } from "@/lib/supabase"
import { SiGoogle } from "react-icons/si"
import { useLocation } from "wouter"

export default function LandingPage() {
  const [, navigate] = useLocation()

  const handleGuestStart = () => {
    navigate('/form')
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Error signing in:', error)
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
            <SiGoogle className="mr-2" />
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
            ゲストとして始める
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
