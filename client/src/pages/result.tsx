import { useEffect, useState } from "react"
import { ResultsVisualization } from "@/components/survey/ResultsVisualization"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { generateLineQR } from "@/lib/line"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

export default function ResultPage({ params }: { params: { id: string } }) {
  const [qrCode, setQrCode] = useState<string>()
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
  useEffect(() => {
    const loadQR = async () => {
      try {
        const qrUrl = await generateLineQR(params.id)
        setQrCode(qrUrl)
      } catch (error) {
        console.error('Error generating QR:', error)
        toast({
          title: "エラー",
          description: "QRコードの生成に失敗しました",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    loadQR()
  }, [params.id])

  const handleCopyId = () => {
    navigator.clipboard.writeText(params.id)
    toast({
      title: "コピーしました",
      description: "IDをクリップボードにコピーしました"
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>測定結果</CardTitle>
          </CardHeader>
          <CardContent>
            <ResultsVisualization yoxoId={params.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>LINEで継続的なアドバイスを受け取る</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <Skeleton className="w-full h-64" />
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <img src={qrCode} alt="LINE QR Code" className="w-64 h-64" />
                <div className="flex items-center space-x-2">
                  <code className="bg-muted px-2 py-1 rounded">{params.id}</code>
                  <Button variant="outline" onClick={handleCopyId}>
                    コピー
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  QRコードを読み取ってLINEで友だち追加後、<br />
                  上記IDを送信してください。
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
