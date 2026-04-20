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
          <small className="italic text-muted-foreground">{"(Lagyan ng tsek (✓) ang iyong sagot sa mga tanong tungkol sa Citizen's Charter (CC). Ang Citizen's Charter ay opisyal na dokumento na naglalahad ng mga serbisyo ng isang ahensya/opisina ng gobyerno, kasama ang mga kinakailangan, bayarin, at tagal ng proseso, at iba pa.)"}</small>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* CC1 */}
        <div className="space-y-4 p-4 rounded-lg bg-muted/50">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
              1
            </span>
            <Label className="flex-col items-start gap-1 text-sm font-medium leading-relaxed text-card-foreground">
              Which of the following best describes your awareness of a CC?
              <br />
              <small className="italic text-muted-foreground">(Alin sa mga sumusunod ang pinakaangkop na paglalarawan ng iyong kaalaman tungkol sa Citizen's Charter (CC)?)</small>
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
                tagalog: "Alam ko kung ano ang CC at nakita ko ang CC ng opisinang ito.",
              },
              {
                value: "2",
                label: "I know what a CC is but I did NOT see this office's CC.",
                tagalog: "Alam ko kung ano ang CC ngunit HINDI ko nakita ang CC ng opisinang ito.",
              },
              {
                value: "3",
                label: "I learned of the CC only when I saw this office's CC.",
                tagalog: "Nalaman ko lang ang CC nang makita ko ang CC ng opisinang ito.",
              },
              {
                value: "4",
                label: "I do not know what a CC is and I did not see one in this office. (Answer 'N/A' on CC2 and CC3)",
                tagalog: "Hindi ko alam kung ano ang CC at wala akong nakitang CC sa opisinang ito. (Sagutin ng 'N/A' ang CC2 at CC3)",
              }
            ].map((option) => {
              const isSelected = formData.cc1 === option.value

              return (
                <div
                  key={option.value}
                  className={`flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-background/50 hover:border-primary/50 hover:bg-background"
                  }`}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`cc1-${option.value}`}
                    className="mt-0.5 size-5 border-2 border-muted-foreground/60 bg-background data-[state=checked]:border-primary data-[state=checked]:bg-primary/10"
                  />
                  <Label
                    htmlFor={`cc1-${option.value}`}
                    className={`flex-col items-start gap-1 text-sm font-normal cursor-pointer leading-relaxed ${
                      isSelected ? "text-foreground" : "text-card-foreground"
                    }`}
                  >
                    <span>{option.label}</span>
                    <small className="block italic text-muted-foreground">({option.tagalog})</small>
                  </Label>
                </div>
              )
            })}
          </RadioGroup>
        </div>

        {/* CC2 */}
        <div className="space-y-4 p-4 rounded-lg bg-muted/50">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
              2
            </span>
            <Label className="flex-col items-start gap-1 text-sm font-medium leading-relaxed text-card-foreground">
              If aware of CC (answered 1-3 in CC1), would you say that the CC of this office was ...?
              <br />
              <small className="italic text-muted-foreground">(Kung may kaalaman ka sa CC (sumagot ng 1-3 sa CC1), paano mo ilalarawan ang CC ng opisinang ito?)</small>
            </Label>
          </div>
          <RadioGroup
            value={formData.cc2}
            onValueChange={(value) => onChange("cc2", value)}
            className="ml-0 md:ml-11 mt-3 md:mt-0 grid grid-cols-2 md:grid-cols-5 gap-2"
          >
            {[
              { value: "1", label: "Easy to see", tagalog: "Madaling makita" },
              { value: "2", label: "Somewhat easy to see", tagalog: "Medyo madaling makita" },
              { value: "3", label: "Difficult to see", tagalog: "Mahirap makita" },
              { value: "4", label: "Not visible at all", tagalog: "Hindi talaga nakikita" },
              { value: "5", label: "N/A", tagalog: "Hindi naaangkop" }
            ].map((option) => {
              const isSelected = formData.cc2 === option.value

              return (
                <div
                  key={option.value}
                  className={`flex items-start space-x-2 rounded-lg border p-3 cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-background/50 hover:border-primary/50 hover:bg-background"
                  }`}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`cc2-${option.value}`}
                    className="mt-0.5 size-5 border-2 border-muted-foreground/60 bg-background data-[state=checked]:border-primary data-[state=checked]:bg-primary/10"
                  />
                  <Label
                    htmlFor={`cc2-${option.value}`}
                    className={`flex-col items-start gap-1 text-sm font-normal cursor-pointer leading-relaxed ${
                      isSelected ? "text-foreground" : "text-card-foreground"
                    }`}
                  >
                    <span className="block">{option.label}</span>
                    <small className="mt-0 block italic text-muted-foreground">({option.tagalog})</small>
                  </Label>  
                </div>
              )
            })}
          </RadioGroup>
        </div>

        {/* CC3 */}
        <div className="space-y-4 p-4 rounded-lg bg-muted/50">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
              3
            </span>
            <Label className="flex-col items-start gap-1 text-sm font-medium leading-relaxed text-card-foreground">
              If aware of CC (answered codes 1-3 in CC1), how much did the CC help you in your transaction?
              <br />
              <small className="italic text-muted-foreground">(Kung may kaalaman ka sa CC (sumagot ng 1-3 sa CC1), gaano nakatulong ang CC sa iyong transaksyon?)</small>
            </Label>
          </div>
          <RadioGroup
            value={formData.cc3}
            onValueChange={(value) => onChange("cc3", value)}
            className="ml-0 md:ml-11 mt-3 md:mt-0 grid grid-cols-2 md:grid-cols-4 gap-2"
          >
            {[
              { value: "1", label: "Helped very much", tagalog: "Malaking naitulong" },
              { value: "2", label: "Somewhat helped", tagalog: "Medyo nakatulong" },
              { value: "3", label: "Did not help", tagalog: "Hindi nakatulong" },
              { value: "4", label: "N/A", tagalog: "Hindi naaangkop" }
            ].map((option) => {
              const isSelected = formData.cc3 === option.value

              return (
                <div
                  key={option.value}
                  className={`flex items-start space-x-2 rounded-lg border p-3 cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-background/50 hover:border-primary/50 hover:bg-background"
                  }`}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`cc3-${option.value}`}
                    className="mt-0.5 size-5 border-2 border-muted-foreground/60 bg-background data-[state=checked]:border-primary data-[state=checked]:bg-primary/10"
                  />
                  <Label
                    htmlFor={`cc3-${option.value}`}
                    className={`flex-col items-start gap-1 text-sm font-normal cursor-pointer leading-relaxed ${
                      isSelected ? "text-foreground" : "text-card-foreground"
                    }`}
                  >
                    <span className="block">{option.label}</span>
                    <small className="mt-1 block italic text-muted-foreground">({option.tagalog})</small>
                  </Label>
                </div>
              )
            })}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  )
})
