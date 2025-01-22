import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface QuestionCardProps {
  question: string
  sectionTitle: string
  sectionDescription: string
  currentIndex: number
  totalQuestions: number
  onAnswer: (value: number) => void
  isLast?: boolean
}

export function QuestionCard({
  question,
  sectionTitle,
  sectionDescription,
  currentIndex,
  totalQuestions,
  onAnswer,
  isLast
}: QuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    setSelected(null)
  }, [question])

  const handleSelect = (value: number) => {
    setSelected(value)
    setTimeout(() => {
      onAnswer(value)
    }, 300)
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{sectionTitle}</CardTitle>
                <CardDescription>{sectionDescription}</CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                {currentIndex + 1} / {totalQuestions}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-lg font-medium">{question}</div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  size="lg"
                  className={cn(
                    "h-20 text-xl relative",
                    selected === value && "border-primary ring-2 ring-primary ring-offset-2"
                  )}
                  onClick={() => handleSelect(value)}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{value}</span>
                    <span className="text-[10px] text-muted-foreground absolute bottom-1">
                      {value === 1 && "全く当てはまらない"}
                      {value === 2 && "あまり当てはまらない"}
                      {value === 3 && "やや当てはまる"}
                      {value === 4 && "とても当てはまる"}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}