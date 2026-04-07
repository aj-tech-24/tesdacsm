"use client"

import { memo } from "react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Emoji3D } from "@/components/emoji-3d"


interface CitizensCharterSectionProps {
  formData: {
    cc1: string
    cc2: string
    cc3: string
  }
  onChange: (field: string, value: string) => void
}

export const CitizensCharterSection = memo(function CitizensCharterSection({ formData, onChange }: CitizensCharterSectionProps) {
  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-card-foreground">
          <Emoji3D emoji="📋" size={28} />
          {"Citizen's Charter (CC) Questions"}
        </CardTitle>
        <CardDescription className="text-card-foreground">
          {"Check mark (✓) your answer to the Citizen's Charter (CC) questions. The Citizen's Charter is an official document that reflects the services of a government agency/office including its requirements, fees, and processing times among others."}
          <br />
          <span className="italic text-muted-foreground" >{"(Lagyan ng tsek (✓) ang iyong sagot sa mga tanong tungkol sa Citizen's Charter (CC). Ang Citizen's Charter ay opisyal na dokumento na naglalahad ng mga serbisyo ng isang ahensya/opisina ng gobyerno, kasama ang mga kinakailangan, bayarin, at tagal ng proseso, at iba pa.)"}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* CC1 */}
        <div className="space-y-4 p-4 rounded-lg bg-muted/50">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
              1
            </span>
            <Label className="text-sm font-medium leading-relaxed text-card-foreground">
              Which of the following best describes your awareness of a CC?
              <br />
              <span className="italic text-muted-foreground">(Alin sa mga sumusunod ang pinakaangkop na paglalarawan ng iyong kaalaman tungkol sa Citizen's Charter (CC)?)</span>
            </Label>
          </div>
          <RadioGroup
            value={formData.cc1}
            onValueChange={(value) => onChange("cc1", value)}
            className="ml-0 md:ml-11 mt-3 md:mt-0 space-y-2"
          >
            {[
              {
                value: "1",
                label: "I know what a CC is and I saw this office's CC.",
              },
              {
                value: "2",
                label: "I know what a CC is but I did NOT see this office's CC.",
              },
              {
                value: "3",
                label: "I learned of the CC only when I saw this office's CC.",
              },
              {
                value: "4",
                label: "I do not know what a CC is and I did not see one in this office. (Answer 'N/A' on CC2 and CC3)",
              }
            ].map((option) => (
              <div key={option.value} className="flex items-start space-x-3 p-2 rounded-md hover:bg-background/50 transition-colors">
                <RadioGroupItem value={option.value} id={`cc1-${option.value}`} className="mt-0.5" />
                <Label htmlFor={`cc1-${option.value}`} className="text-sm font-normal cursor-pointer leading-relaxed text-card-foreground">
                  <span>{option.label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* CC2 */}
        <div className="space-y-4 p-4 rounded-lg bg-muted/50">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
              2
            </span>
            <Label className="text-sm font-medium leading-relaxed text-card-foreground">
              If aware of CC (answered 1-3 in CC1), would you say that the CC of this office was ...?
              <br />
              <span className="italic text-muted-foreground">(Kung may kaalaman ka sa CC (sumagot ng 1-3 sa CC1), paano mo ilalarawan ang CC ng opisinang ito?)</span>
            </Label>
          </div>
          <RadioGroup
            value={formData.cc2}
            onValueChange={(value) => onChange("cc2", value)}
            className="ml-0 md:ml-11 mt-3 md:mt-0 grid grid-cols-2 md:grid-cols-5 gap-2"
          >
            {[
              { value: "1", label: "Easy to see" },
              { value: "2", label: "Somewhat easy to see" },
              { value: "3", label: "Difficult to see" },
              { value: "4", label: "Not visible at all" },
              { value: "5", label: "N/A" }
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-2 p-2 rounded-md hover:bg-background/50 transition-colors">
                <RadioGroupItem value={option.value} id={`cc2-${option.value}`} />
                <Label htmlFor={`cc2-${option.value}`} className="text-sm font-normal cursor-pointer text-card-foreground">
                  <span>{option.label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* CC3 */}
        <div className="space-y-4 p-4 rounded-lg bg-muted/50">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
              3
            </span>
            <Label className="text-sm font-medium leading-relaxed text-card-foreground">
              If aware of CC (answered codes 1-3 in CC1), how much did the CC help you in your transaction?
              <br />
              <span className="italic text-muted-foreground">(Kung may kaalaman ka sa CC (sumagot ng 1-3 sa CC1), gaano nakatulong ang CC sa iyong transaksyon?)</span>
            </Label>
          </div>
          <RadioGroup
            value={formData.cc3}
            onValueChange={(value) => onChange("cc3", value)}
            className="ml-0 md:ml-11 mt-3 md:mt-0 grid grid-cols-2 md:grid-cols-4 gap-2"
          >
            {[
              { value: "1", label: "Helped very much" },
              { value: "2", label: "Somewhat helped" },
              { value: "3", label: "Did not help" },
              { value: "4", label: "N/A" }
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-2 p-2 rounded-md hover:bg-background/50 transition-colors">
                <RadioGroupItem value={option.value} id={`cc3-${option.value}`} />
                <Label htmlFor={`cc3-${option.value}`} className="text-sm font-normal cursor-pointer text-card-foreground">
                  <span>{option.label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  )
})
