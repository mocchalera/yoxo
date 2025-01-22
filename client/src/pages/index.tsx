import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLocation } from "wouter"

export default function LandingPage() {
  const [, navigate] = useLocation()

  const handleStart = () => {
    navigate('/form')
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
            className="w-full"
            onClick={handleStart}
          >
            測定を開始する
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}