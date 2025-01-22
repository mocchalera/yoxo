import { useQuery } from "@tanstack/react-query"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

interface DashboardData {
  history: {
    date: string;
    brain_fatigue: number;
    mental_fatigue: number;
    fatigue_source: number;
    resilience: number;
  }[];
  stats: {
    total_measurements: number;
    avg_resilience: number;
    common_fatigue_type: string;
  };
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  })

  if (isLoading) {
    return (
      <div className="container py-8 space-y-8">
        <Skeleton className="w-full h-[400px]" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="w-full h-[120px]" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const formatDate = (date: string) => {
    return format(new Date(date), "M/d", { locale: ja })
  }

  return (
    <div className="container py-8 space-y-8">
      <h1 className="text-3xl font-bold">疲労分析ダッシュボード</h1>

      <Card>
        <CardHeader>
          <CardTitle>疲労度の推移</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={formatDate}
                  formatter={(value: number) => [`${value.toFixed(1)}`, ""]}
                />
                <Legend />
                <Line
                  name="脳疲労"
                  type="monotone"
                  dataKey="brain_fatigue"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                />
                <Line
                  name="心疲労"
                  type="monotone"
                  dataKey="mental_fatigue"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                />
                <Line
                  name="疲労源"
                  type="monotone"
                  dataKey="fatigue_source"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                />
                <Line
                  name="レジリエンス"
                  type="monotone"
                  dataKey="resilience"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              総測定回数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.total_measurements}回
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              平均レジリエンス
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.avg_resilience.toFixed(1)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              最も多い疲労タイプ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.common_fatigue_type}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
