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
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  size="lg"
                  className={cn(
                    "h-24 text-2xl relative",
                    selected === value && "border-primary ring-2 ring-primary ring-offset-2"
                  )}
                  onClick={() => handleSelect(value)}
                >
                  {value}
                  {value === 1 && <span className="absolute text-xs bottom-2">全く当てはまらない</span>}
                  {value === 2 && <span className="absolute text-xs bottom-2">あまり当てはまらない</span>}
                  {value === 3 && <span className="absolute text-xs bottom-2">やや当てはまる</span>}
                  {value === 4 && <span className="absolute text-xs bottom-2">とても当てはまる</span>}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
