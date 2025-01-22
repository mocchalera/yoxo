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

  const formSchema = z.object({
    responses: z.array(z.string().regex(/^[1-4]$/))
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      responses: Array(section.questions.length).fill("")
    }
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setSubmitting(true)
      if (isLastSection) {
        // Get current user if logged in
        const user = await getCurrentUser();

        const response = await fetch('/api/submit-survey', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            responses: values.responses.map(Number),
            userId: user?.id // Add user ID if available
          })
        })

        if (!response.ok) throw new Error('提出に失敗しました')

        const { yoxoId, advice } = await response.json()
        if (advice) {
          setAdvice(advice)
          // Show advice for 5 seconds before redirecting
          setTimeout(() => {
            onComplete(yoxoId)
          }, 5000)
        } else {
          onComplete(yoxoId)
        }
      } else {
        onSectionComplete()
        form.reset()
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        title: "エラー",
        description: "送信に失敗しました。もう一度お試しください。",
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
          <Button type="submit" className="w-full">
            {isLastSection ? "測定完了" : "次へ"}
          </Button>
        )}
      </form>
    </Form>
  )
}