import { useState } from "react"
import { useLocation } from "wouter"
import { QuestionnaireForm } from "@/components/survey/QuestionnaireForm"
import { Progress } from "@/components/ui/progress"

const sections = [
  {
    title: "疲労源E",
    description: "過去2週間の疲労要因評価",
    questions: [
      "仕事や家事を長時間する必要があった",
      "常に時間に追われている感じだった",
      "締め切りに追われた作業が多かった",
      "難しい問題を解決する必要があった",
      "複数の仕事を同時にこなす必要があった",
      "予定外の仕事が入ることが多かった"
    ]
  },
  {
    title: "疲労マネジメント行動B",
    description: "疲労への対処行動評価",
    questions: [
      "十分な睡眠時間を確保するようにした",
      "バランスの良い食事を心がけた",
      "適度な運動を行うようにした",
      "息抜きの時間を確保するようにした",
      "人と話をして気分転換をした",
      "仕事とプライベートの切り替えを意識した"
    ]
  },
  {
    title: "疲労感Fs",
    description: "主観的疲労感の評価",
    questions: [
      "体が疲れやすい",
      "気力が出ない",
      "イライラする",
      "集中力が続かない"
    ]
  }
]

export default function FormPage() {
  const [currentSection, setCurrentSection] = useState(0)
  const [, navigate] = useLocation()
  const progress = ((currentSection + 1) / sections.length) * 100

  const handleComplete = async (yoxoId: string) => {
    navigate(`/result/${yoxoId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Progress value={progress} className="w-full" />

        <QuestionnaireForm
          section={sections[currentSection]}
          onComplete={handleComplete}
          onSectionComplete={() => setCurrentSection(c => c + 1)}
          isLastSection={currentSection === sections.length - 1}
        />
      </div>
    </div>
  )
}