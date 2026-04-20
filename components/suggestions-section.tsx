"use client"

import { memo } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Emoji3D } from "@/components/emoji-3d"


interface SuggestionsSectionProps {
  formData: {
    suggestions: string
    email: string
    employeeName: string
  }
  onChange: (field: string, value: string) => void
}

export const SuggestionsSection = memo(function SuggestionsSection({ formData, onChange }: SuggestionsSectionProps) {
  const employees = [
    { name: "Althea Kate L. Cobias", position: "Technical Staff" },
    { name: "Zyrah Marie B. Sugui", position: "Technical Staff" },
    { name: "Jessa Lou E. Barimbad", position: "Technical Staff" },
    { name: "Shaina A. Enico", position: "Technical Staff" },
    { name: "Rechel T. Inalim", position: "Administrative Staff" },
    { name: "Bea Len G. Embodo", position: "Administrative Staff" },
    { name: "Lester Van S. Alimento", position: "Administrative Staff" },
    { name: "Lewin T. Israel", position: "Administrative Staff" },
    { name: "Jimark A. Tortor", position: "TESD Specialist II" },
    { name: "Geoffrey Jr. D. Lastimoso", position: "TESD Specialist II" },
    { name: "Jenquie Karen N. Alinsonorin", position: "TESD Specialist II" },
    { name: "Mark Louie P. Galvanor", position: "Administrative Officer V" },
    { name: "Ariel R. De Castro", position: "Administrative Assistant III" },
    { name: "Luzyle C. Corcuera", position: "Sr. TESD Specialist" },
  ]

  const selectedEmployee = employees.find((employee) => employee.name === formData.employeeName)

  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-card-foreground">
          <Emoji3D emoji="💬" size={28} />
          Additional Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="suggestions" className="text-sm font-medium text-card-foreground">
            Suggestions on how we can further improve our services (optional)
          </Label>
          <Textarea
            id="suggestions"
            placeholder="Share your thoughts and suggestions..."
            value={formData.suggestions}
            onChange={(e) => onChange("suggestions", e.target.value)}
            className="min-h-[120px] resize-none bg-background"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-card-foreground">
              Email Address (optional)
            </Label>
            <Input
              type="email"
              id="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => onChange("email", e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employeeName" className="text-sm font-medium text-card-foreground">
              {"Employee's Full Name"}
            </Label>
            <Select value={formData.employeeName} onValueChange={(value) => onChange("employeeName", value)}>
              <SelectTrigger id="employeeName" className="w-full bg-background">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.name} value={employee.name}>
                    <div className="flex flex-col leading-tight">
                      <span>{employee.name}</span>
                      <span className="text-xs text-muted-foreground italic">{employee.position}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
