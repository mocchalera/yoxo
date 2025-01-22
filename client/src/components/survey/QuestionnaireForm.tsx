import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCurrentUser } from "@/lib/supabase"
import { Progress } from "@/components/ui/progress"
import { QuestionCard } from "./QuestionCard"

interface QuestionnaireFormProps {
  section: {
    title: string
    description: string
    questions: string[]
  }
  onComplete: (yoxoId: string) => void
  onSectionComplete: () => void
  isLastSection: boolean
}

export function QuestionnaireForm({
  section,
  onComplete,
  onSectionComplete,
  isLastSection
}: QuestionnaireFormProps) {
  const { toast } = useToast()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [advice, setAdvice] = useState<string | null>(null)

  const progress = (responses.length / section.questions.length) * 100

  const handleAnswer = async (value: number) => {
    const newResponses = [...responses, value]
    setResponses(newResponses)

    if (newResponses.length === section.questions.length) {
      try {
        setSubmitting(true)

        if (isLastSection) {
          let userId = null
          try {
            const user = await getCurrentUser()
            if (user) {
              userId = user.id
            }
          } catch (error) {
            console.log('No authenticated user, proceeding as guest')
          }

          // 前のセクションの回答を取得
          const previousResponses = JSON.parse(sessionStorage.getItem('survey_responses') || '[]')
          // 現在のセクションの回答を追加
          const allResponses = [...previousResponses, ...newResponses]

          console.log('Submitting responses:', allResponses) // デバッグ用

          const response = await fetch('/api/submit-survey', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              responses: allResponses,
              userId
            })
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(errorText || '提出に失敗しました')
          }

          const data = await response.json()
          sessionStorage.removeItem('survey_responses')

          if (data.advice) {
            setAdvice(data.advice)
            setTimeout(() => {
              onComplete(data.yoxoId)
            }, 5000)
          } else {
            onComplete(data.yoxoId)
          }
        } else {
          // 現在のセクションの回答を保存
          const previousResponses = JSON.parse(sessionStorage.getItem('survey_responses') || '[]')
          sessionStorage.setItem('survey_responses', JSON.stringify([...previousResponses, ...newResponses]))
          onSectionComplete()
        }
      } catch (error) {
        console.error('Error submitting survey:', error) // デバッグ用
        toast({
          title: "エラー",
          description: error instanceof Error ? error.message : "送信に失敗しました。もう一度お試しください。",
          variant: "destructive"
        })
      } finally {
        setSubmitting(false)
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  return (
    <div className="space-y-6">
      <Progress value={progress} className="h-2" />

      {!submitting && currentQuestionIndex < section.questions.length && (
        <QuestionCard
          question={section.questions[currentQuestionIndex]}
          sectionTitle={section.title}
          sectionDescription={section.description}
          currentIndex={currentQuestionIndex}
          totalQuestions={section.questions.length}
          onAnswer={handleAnswer}
          isLast={isLastSection && currentQuestionIndex === section.questions.length - 1}
        />
      )}

      {submitting && (
        <Alert>
          <AlertDescription>
            送信中...
          </AlertDescription>
        </Alert>
      )}

      {advice && (
        <Alert>
          <AlertDescription className="whitespace-pre-line">
            {advice}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}