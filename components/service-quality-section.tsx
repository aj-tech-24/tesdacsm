"use client"

import { memo } from "react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { Emoji3D } from "@/components/emoji-3d"

const serviceQuestions = [
  {
    id: "sqd0",
    label: "SQD0",
    question: "I am satisfied with the service that I availed.",
    questionTl: "Nasiyahan ako sa serbisyong aking nakuha."
  },
  {
    id: "sqd1",
    label: "SQD1",
    question: "I spent a reasonable amount of time for my transaction.",
    questionTl: "Makatwiran ang oras na ginugol ko para sa aking transaksyon."
  },
  {
    id: "sqd2",
    label: "SQD2",
    question: "The office followed the transaction's requirements and steps based on the information provided.",
    questionTl: "Sinunod ng opisina ang mga kinakailangan at hakbang ng transaksyon batay sa ibinigay na impormasyon."
  },
  {
    id: "sqd3",
    label: "SQD3",
    question: "The steps (including payment) I needed to do for my transaction were easy and simple.",
    questionTl: "Madali at simple ang mga hakbang (kasama ang pagbabayad) na kailangan kong gawin para sa aking transaksyon."
  },
  {
    id: "sqd4",
    label: "SQD4",
    question: "I easily found information about my transaction from the office or its website.",
    questionTl: "Madali kong nahanap ang impormasyon tungkol sa aking transaksyon mula sa opisina o sa kanilang website."
  },
  {
    id: "sqd5",
    label: "SQD5",
    question: "I paid a reasonable amount of fees for my transaction. (If service was free, mark the N/A column)",
    questionTl: "Makatwiran ang halagang binayaran ko para sa aking transaksyon. (Kung libre ang serbisyo, piliin ang N/A na column)"
  },
  {
    id: "sqd6",
    label: "SQD6",
    question: "I feel the office was fair to everyone, or \"walang palakasan\", during my transaction.",
    questionTl: "Naramdaman kong patas ang opisina sa lahat, o \"walang palakasan\", sa aking transaksyon."
  },
  {
    id: "sqd7",
    label: "SQD7",
    question: "I was treated courteously by the staff, and (if asked for help) the staff was helpful.",
    questionTl: "Magalang ang pagtrato sa akin ng mga kawani, at (kung humingi ako ng tulong) naging matulungin sila."
  },
  {
    id: "sqd8",
    label: "SQD8",
    question: "I got what I needed from the government office, or (if denied) denial of request was sufficiently explained to me.",
    questionTl: "Nakuha ko ang kailangan ko mula sa opisina ng gobyerno, o kung hindi naaprubahan, sapat na naipaliwanag sa akin ang dahilan."
  }
]

const ratingOptions = [
  { value: "1", label: "Strongly Disagree", labelTl: "Lubos na Hindi Sumasang-ayon", emoji: "😠" },
  { value: "2", label: "Disagree", labelTl: "Hindi Sumasang-ayon", emoji: "😟" },
  { value: "3", label: "Neither Agree nor Disagree", labelTl: "Hindi Tiyak / Neutral", emoji: "😐" },
  { value: "4", label: "Agree", labelTl: "Sumasang-ayon", emoji: "😊" },
  { value: "5", label: "Strongly Agree", labelTl: "Lubos na Sumasang-ayon", emoji: "😍" },
  { value: "na", label: "N/A", labelTl: "Hindi Naaangkop (N/A)", emoji: "➖" }
] as const

interface ServiceQualitySectionProps {
  formData: Record<string, string>
  onChange: (field: string, value: string) => void
}

export const ServiceQualitySection = memo(function ServiceQualitySection({ formData, onChange }: ServiceQualitySectionProps) {
  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-card-foreground">
          <Emoji3D emoji="⭐" size={28} />
          Service Quality Dimensions
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          For SQD 0-8, please put a check mark (✓) on the column that best corresponds to your answer.
          <br />
          <span className="italic">(Para sa SQD 0-8, pakilagyan ng tsek (✓) ang column na pinakaangkop sa iyong sagot.)</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Rating Legend */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/50 border border-border/50">
          <p className="text-xs text-center text-muted-foreground mb-1 font-medium">Click the emoji that best represents your experience</p>
          <p className="text-xs text-center text-muted-foreground mb-3 italic">(I-click ang emoji na pinakaangkop sa iyong karanasan.)</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {ratingOptions.map((option) => (
              <div key={option.value} className="flex flex-col items-center text-center p-2 rounded-lg hover:bg-background/50 transition-colors">
                <Emoji3D emoji={option.emoji} size={36} className="mb-1" />
                <span className="text-xs text-muted-foreground leading-tight">{option.label}</span>
                <span className="text-[11px] text-muted-foreground leading-tight italic">({option.labelTl})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {serviceQuestions.map((q, index) => {
            const hasSelection = !!formData[q.id]
            return (
              <div
                key={q.id}
                className={cn(
                  "p-4 rounded-lg transition-colors",
                  index % 2 === 0 ? "bg-muted/30" : "bg-background"
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-start gap-3 lg:flex-1">
                    <span className="flex-shrink-0 px-2 py-1 rounded text-xs font-semibold bg-primary text-primary-foreground">
                      {q.label}
                    </span>
                    <Label className="text-sm text-card-foreground leading-relaxed">
                      <span>{q.question}</span>
                      <br />
                      <span className="italic text-muted-foreground">({q.questionTl})</span>
                    </Label>
                  </div>
                  <RadioGroup
                    value={formData[q.id] || ""}
                    onValueChange={(value) => onChange(q.id, value)}
                    className="flex flex-wrap lg:flex-nowrap gap-2 lg:gap-1"
                  >
                    {ratingOptions.map((option) => {
                      const isSelected = formData[q.id] === option.value
                      return (
                        <div key={option.value} className="relative">
                          <RadioGroupItem
                            value={option.value}
                            id={`${q.id}-${option.value}`}
                            className="sr-only"
                          />
                          <Label
                            htmlFor={`${q.id}-${option.value}`}
                            className={cn(
                              "flex items-center justify-center w-11 h-11 rounded-xl cursor-pointer transition-all duration-200 border-2",
                              isSelected
                                ? "border-primary bg-primary/10 scale-110 shadow-md"
                                : hasSelection
                                  ? "border-border/40 hover:border-primary/50 hover:scale-105 opacity-35 grayscale hover:opacity-80 hover:grayscale-0"
                                  : "border-border hover:border-primary/50 hover:bg-muted/50 hover:scale-105"
                            )}
                          >
                            <Emoji3D emoji={option.emoji} size={28} />
                          </Label>
                        </div>
                      )
                    })}
                  </RadioGroup>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
})
