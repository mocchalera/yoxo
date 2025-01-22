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
          const previousSections = sessionStorage.getItem('survey_responses')
          const previousResponses = previousSections ? JSON.parse(previousSections) : []
          const allResponses = [...previousResponses, ...newResponses].slice(0, 16)

          const requestData = {
            responses: allResponses,
            supabaseId: user?.id || '00000000-0000-0000-0000-000000000000'
          }

          console.log('Submitting survey responses:', requestData)

          const response = await fetch('/api/submit-survey', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
            credentials: 'include'
          })

          const data = await response.json()

          if (!response.ok) {
            console.error('Server error:', data)
            throw new Error(data.message || data.error || '送信に失敗しました')
          }

          console.log('Server response:', data)

          sessionStorage.removeItem('survey_responses')
          setTimeout(() => {
            onComplete(data.yoxoId)
          }, 1000)
        } else {
          const previousResponses = JSON.parse(sessionStorage.getItem('survey_responses') || '[]')
          sessionStorage.setItem('survey_responses', JSON.stringify([...previousResponses, ...newResponses]))
          setSubmitting(false)
          onSectionComplete()
        }
      } catch (error) {
        console.error('Error details:', error)
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