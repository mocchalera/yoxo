import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { QuestionCard } from "./QuestionCard"
import { useAuth } from "@/lib/AuthContext"

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
  const { user } = useAuth()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const progress = (currentQuestionIndex / section.questions.length) * 100

  // セクションが変更されたときに状態をリセット
  useEffect(() => {
    setCurrentQuestionIndex(0)
    setResponses([])
    setError(null)
    setSubmitting(false)
  }, [section])

  const handleAnswer = async (value: number) => {
    const newResponses = [...responses, value]
    setResponses(newResponses)

    if (currentQuestionIndex + 1 === section.questions.length) {
      try {
        setSubmitting(true)
        setError(null)

        if (isLastSection) {
          const previousResponses = JSON.parse(sessionStorage.getItem('survey_responses') || '[]')
          const allResponses = [...previousResponses, ...newResponses]

          console.log('Submitting survey responses:', {
            responses: allResponses,
            supabaseId: user?.id
          });

          const response = await fetch('/api/submit-survey', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              responses: allResponses.slice(0, 16), // 最初の16個の回答のみを使用
              supabaseId: user?.id
            })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || errorData.error || '送信に失敗しました')
          }

          const data = await response.json()
          sessionStorage.removeItem('survey_responses')

          if (data.scores) {
            setTimeout(() => {
              onComplete(data.yoxoId)
            }, 1000)
          } else {
            onComplete(data.yoxoId)
          }
        } else {
          const previousResponses = JSON.parse(sessionStorage.getItem('survey_responses') || '[]')
          sessionStorage.setItem('survey_responses', JSON.stringify([...previousResponses, ...newResponses]))
          setSubmitting(false)
          onSectionComplete()
        }
      } catch (error) {
        console.error('Error handling responses:', error)
        const errorMessage = error instanceof Error ? error.message : "送信に失敗しました。もう一度お試しください。"
        setError(errorMessage)
        toast({
          title: "エラー",
          description: errorMessage,
          variant: "destructive"
        })
        setSubmitting(false)
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  return (
    <div className="space-y-6">
      <Progress value={progress} className="h-2" />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
    </div>
  )
}