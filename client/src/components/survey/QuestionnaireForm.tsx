import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { responseSchema } from "@db/schema"
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

  // フォームのバリデーションスキーマを作成
  const formSchema = z.object({
    responses: z.array(z.string().regex(/^[1-4]$/)).length(section.questions.length)
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      responses: Array(section.questions.length).fill("")
    }
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log('Form submitted with values:', values); // デバッグログ
      setSubmitting(true)

      if (isLastSection) {
        // Get current user if logged in
        const user = await getCurrentUser();
        console.log('Current user:', user); // デバッグログ

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
          const errorText = await response.text();
          console.error('Survey submission failed:', errorText); // デバッグログ
          throw new Error(errorText || '提出に失敗しました');
        }

        const data = await response.json()
        console.log('Survey submission response:', data); // デバッグログ

        if (data.advice) {
          setAdvice(data.advice)
          // Show advice for 5 seconds before redirecting
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

  // フォームのバリデーションエラーをログに出力
  console.log('Form errors:', form.formState.errors); // デバッグログ

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
            disabled={!form.formState.isValid}
          >
            {isLastSection ? "測定完了" : "次へ"}
          </Button>
        )}
      </form>
    </Form>
  )
}