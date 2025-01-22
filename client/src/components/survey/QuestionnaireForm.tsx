import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCurrentUser } from "@/lib/supabase"

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
  const [submitting, setSubmitting] = useState(false)
  const [advice, setAdvice] = useState<string | null>(null)
  const form = useForm({
    defaultValues: {
      responses: Array(section.questions.length).fill("")
    }
  })

  const onSubmit = async (values: { responses: string[] }) => {
    try {
      setSubmitting(true)

      if (isLastSection) {
        let userId = null;
        try {
          const user = await getCurrentUser();
          if (user) {
            userId = user.id;
          }
        } catch (error) {
          console.log('No authenticated user, proceeding as guest');
        }

        const allResponses = JSON.parse(sessionStorage.getItem('survey_responses') || '[]')
        allResponses.push(...values.responses)

        const response = await fetch('/api/submit-survey', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            responses: allResponses.map(Number),
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
        const currentResponses = JSON.parse(sessionStorage.getItem('survey_responses') || '[]')
        currentResponses.push(...values.responses)
        sessionStorage.setItem('survey_responses', JSON.stringify(currentResponses))

        onSectionComplete()
        form.reset()
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "送信に失敗しました。もう一度お試しください。",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {section.questions.map((question, index) => (
          <FormField
            key={index}
            control={form.control}
            name={`responses.${index}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{question}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex space-x-4"
                  >
                    {[1, 2, 3, 4].map((value) => (
                      <FormItem key={value} className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value={String(value)} />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {value}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
        ))}

        {advice && (
          <Alert>
            <AlertDescription className="whitespace-pre-line">
              {advice}
            </AlertDescription>
          </Alert>
        )}

        {submitting ? (
          <Skeleton className="w-full h-10" />
        ) : (
          <Button
            type="submit"
            className="w-full"
          >
            {isLastSection ? "測定完了" : "次へ"}
          </Button>
        )}
      </form>
    </Form>
  )
}