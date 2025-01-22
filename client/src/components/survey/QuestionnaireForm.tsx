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
      // Check if all questions are answered
      // RadioGroupの値は文字列の "1", "2", "3", "4" のいずれかになるはず
      const validResponses = values.responses.every(response => 
        ["1", "2", "3", "4"].includes(response)
      )

      console.log('Form validation:', {
        responses: values.responses,
        validResponses
      })

      if (!validResponses) {
        toast({
          title: "エラー",
          description: "すべての質問に回答してください",
          variant: "destructive"
        })
        return
      }

      setSubmitting(true)

      if (isLastSection) {
        const user = await getCurrentUser()

        const response = await fetch('/api/submit-survey', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            responses: values.responses.map(Number),
            userId: user?.id
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Survey submission failed:', errorText)
          throw new Error(errorText || '提出に失敗しました')
        }

        const data = await response.json()
        console.log('Survey submission successful:', data)

        if (data.advice) {
          setAdvice(data.advice)
          setTimeout(() => {
            onComplete(data.yoxoId)
          }, 5000)
        } else {
          onComplete(data.yoxoId)
        }
      } else {
        onSectionComplete()
        form.reset()
      }
    } catch (error) {
      console.error('Error submitting form:', error)
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