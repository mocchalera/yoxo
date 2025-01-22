import { useQuery } from "@tanstack/react-query"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

type FatigueScores = {
  fatigue_type: string;
  brain_fatigue: number;
  mental_fatigue: number;
  fatigue_source: number;
  resilience: number;
  advice?: string | null;
}

interface ResultsVisualizationProps {
  yoxoId: string
}

export function ResultsVisualization({ yoxoId }: ResultsVisualizationProps) {
  const { toast } = useToast()
  const { data: results, isLoading, error } = useQuery<FatigueScores>({
    queryKey: [`/api/results/${yoxoId}`],
    onError: (err: Error) => {
      console.error('Error fetching results:', err)
      toast({
        title: "エラー",
        description: "結果の取得に失敗しました",
        variant: "destructive"
      })
    }
  })

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          結果の取得に失敗しました。もう一度お試しください。
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return <Skeleton className="w-full h-64" />
  }

  if (!results) {
    return (
      <Alert>
        <AlertDescription>結果が見つかりませんでした</AlertDescription>
      </Alert>
    )
  }

  const chartData = [
    { name: '脳疲労', value: results.brain_fatigue },
    { name: '心疲労', value: results.mental_fatigue },
    { name: '疲労源', value: results.fatigue_source },
    { name: 'レジリエンス', value: results.resilience }
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>あなたの疲労タイプ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-center">
            {results.fatigue_type}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>測定結果</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {results.advice && (
        <Card>
          <CardHeader>
            <CardTitle>AIアドバイス</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription className="whitespace-pre-line">
                {results.advice}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}