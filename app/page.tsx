"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { FormHeader } from "@/components/form-header"
import { ClientInfoSection } from "@/components/client-info-section"
import { CitizensCharterSection } from "@/components/citizens-charter-section"
import { ServiceQualitySection } from "@/components/service-quality-section"
import { SuggestionsSection } from "@/components/suggestions-section"
import { OfficeSelection } from "@/components/office-selection"
import { Emoji3D } from "@/components/emoji-3d"
import { buildClientFeedbackPrintHtml, type FeedbackPrintSnapshot } from "@/lib/csm-print-template"
import { Send, ArrowLeft } from "lucide-react"

const SELECTED_OFFICE_KEY = "selectedOffice"

const getStoredOffice = () => {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(SELECTED_OFFICE_KEY) || ""
}

export default function ClientSatisfactionForm() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOfficeReady, setIsOfficeReady] = useState(false)
  const [submittedSnapshot, setSubmittedSnapshot] = useState<FeedbackPrintSnapshot | null>(null)

  const [clientInfo, setClientInfo] = useState({
    office: "",
    clientType: "",
    date: "",
    name: "",
    sex: "",
    age: "",
    regionOfResidence: "Region XI",
    province: "",
    municipality: "",
    citizensCharterService: "",
    transactionTypes: [] as string[]
  })

  const [ccQuestions, setCcQuestions] = useState({
    cc1: "",
    cc2: "",
    cc3: ""
  })

  const [sqd, setSqd] = useState<Record<string, string>>({})

  const [suggestions, setSuggestions] = useState({
    suggestions: "",
    email: "",
    employeeName: ""
  })

  const handleClientInfoChange = useCallback((field: string, value: string | string[]) => {
    if (field === "office" && typeof value === "string" && value.trim()) {
      localStorage.setItem(SELECTED_OFFICE_KEY, value)
    }
    setClientInfo(prev => ({ ...prev, [field]: value }))
  }, [])

  useEffect(() => {
    const storedOffice = getStoredOffice()
    setClientInfo(prev => {
      if (prev.office || !storedOffice) return prev
      return { ...prev, office: storedOffice }
    })
    setIsOfficeReady(true)
  }, [])

  const handleCcChange = useCallback((field: string, value: string) => {
    setCcQuestions(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSqdChange = useCallback((field: string, value: string) => {
    setSqd(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSuggestionsChange = useCallback((field: string, value: string) => {
    setSuggestions(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/submit-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientInfo, ccQuestions, sqd, suggestions })
      })

      const payload = await response.json()

      if (response.ok) {
        setSubmittedSnapshot({
          submittedAt: new Date().toISOString(),
          controlNumber: payload.controlNumber || "",
          dbId: typeof payload.dbId === "number" ? payload.dbId : null,
          clientInfo: {
            office: clientInfo.office,
            clientType: clientInfo.clientType,
            name: clientInfo.name,
            sex: clientInfo.sex,
            age: clientInfo.age,
            regionOfResidence: clientInfo.regionOfResidence,
            province: clientInfo.province,
            municipality: clientInfo.municipality,
            citizensCharterService: clientInfo.citizensCharterService,
            transactionTypes: [...clientInfo.transactionTypes],
          },
          ccQuestions: {
            cc1: ccQuestions.cc1,
            cc2: ccQuestions.cc2,
            cc3: ccQuestions.cc3,
          },
          sqd: { ...sqd },
          suggestions: {
            suggestions: suggestions.suggestions,
            email: suggestions.email,
            employeeName: suggestions.employeeName,
          },
        })
        setIsSubmitted(true)
      } else {
        alert("Failed to submit feedback: " + (payload.error || "Unknown error"))
      }
    } catch (error) {
      console.error("Submission Error", error)
      alert("An error occurred while submitting. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setIsSubmitted(false)
    setSubmittedSnapshot(null)
    const savedOffice = getStoredOffice()
    setClientInfo({
      office: savedOffice,
      clientType: "",
      date: "",
      name: "",
      sex: "",
      age: "",
      regionOfResidence: "Region XI",
      province: "",
      municipality: "",
      citizensCharterService: "",
      transactionTypes: []
    })
    setCcQuestions({ cc1: "", cc2: "", cc3: "" })
    setSqd({})
    setSuggestions({ suggestions: "", email: "", employeeName: "" })
  }

  const handlePrintFeedback = () => {
    if (!submittedSnapshot) {
      alert("No feedback details found to print.")
      return
    }

    const printWindow = window.open("", "_blank", "width=900,height=1000")
    if (!printWindow) {
      alert("Unable to open print window. Please allow pop-ups for this site.")
      return
    }

    const submittedDate = new Date(submittedSnapshot.submittedAt).toLocaleString("en-PH", {
      dateStyle: "medium",
    })

    const siteOrigin = window.location.origin
    const logoUrl = `${siteOrigin}/tesda-logo.png`

    const html = buildClientFeedbackPrintHtml(submittedSnapshot, submittedDate, logoUrl)

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()

    let hasTriggeredPrint = false

    const triggerPrint = () => {
      if (hasTriggeredPrint) return
      hasTriggeredPrint = true
      try {
        printWindow.focus()
        printWindow.print()
      } catch {
        alert("Printing failed to start automatically. Please use Ctrl+P in the opened window.")
      }
    }

    const fallbackTimer = window.setTimeout(triggerPrint, 900)

    printWindow.onload = () => {
      // Delay a bit so styles and image assets are painted before opening print preview.
      window.clearTimeout(fallbackTimer)
      window.setTimeout(triggerPrint, 350)
    }
  }

  const sqdSummary = useMemo(() => {
    const counts = {
      positive: 0,
      neutral: 0,
      negative: 0,
    }

    for (const [key, value] of Object.entries(sqd)) {
      if (!key.startsWith("sqd") || !value || value === "na") continue
      if (value === "4" || value === "5") counts.positive += 1
      else if (value === "3") counts.neutral += 1
      else if (value === "1" || value === "2") counts.negative += 1
    }

    let mood: "Positive" | "Neutral" | "Negative" = "Neutral"
    let moodEmoji = "🙂"
    let moodText = "Neutral feedback received"

    if (counts.positive > counts.neutral && counts.positive > counts.negative) {
      mood = "Positive"
      moodEmoji = "😍"
      moodText = "Positive feedback received"
    } else if (counts.negative > counts.neutral && counts.negative > counts.positive) {
      mood = "Negative"
      moodEmoji = "😟"
      moodText = "Constructive feedback received"
    }

    return {
      counts,
      mood,
      moodEmoji,
      moodText,
    }
  }, [sqd])

  if (isSubmitted) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-blue-50 py-10 px-4">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-8rem] left-[-5rem] h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
          <div className="absolute bottom-[-9rem] right-[-4rem] h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-md shadow-xl p-6 md:p-10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Emoji3D emoji="🎉" size={56} />
                <Emoji3D emoji={sqdSummary.moodEmoji} size={66} />
                <Emoji3D emoji="🙏" size={56} />
              </div>

              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800 mb-2">
                Thank You for Your Feedback
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Your response has been submitted successfully. {sqdSummary.moodText}.
                Your feedback helps us improve every transaction.
              </p>

            </div>

            <div className="mt-8 flex justify-center">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button onClick={handlePrintFeedback} variant="outline" size="lg" className="gap-2 px-8">
                  <Emoji3D emoji="🖨️" size={20} /> Print Feedback
                </Button>
                <Button onClick={handleReset} size="lg" className="gap-2 px-8">
                  <Emoji3D emoji="📝" size={20} /> Submit Another Response
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!isOfficeReady) {
    return (
      <main className="min-h-screen bg-background py-8 px-4" />
    )
  }

  if (!clientInfo.office) {
    return <OfficeSelection onSelect={(office) => handleClientInfoChange("office", office)} />
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Back Button */}
          <div className="mb-2">
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground -ml-3"
              onClick={() => handleClientInfoChange("office", "")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Office Selection
            </Button>
          </div>

          {/* Header */}
          <div className="bg-card rounded-2xl shadow-sm p-6 md:p-8">
            <FormHeader office={clientInfo.office} />
          </div>

          {/* Client Information */}
          <ClientInfoSection
            formData={clientInfo}
            onChange={handleClientInfoChange}
          />

          {/* Citizens Charter Questions */}
          <CitizensCharterSection
            formData={ccQuestions}
            onChange={handleCcChange}
          />

          {/* Service Quality Dimensions */}
          <ServiceQualitySection
            formData={sqd}
            onChange={handleSqdChange}
          />

          {/* Suggestions */}
          <SuggestionsSection
            formData={suggestions}
            onChange={handleSuggestionsChange}
          />

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <Button type="submit" size="lg" className="gap-2 px-8" disabled={isSubmitting}>
              <Send className="w-4 h-4" />
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center pt-6 pb-4">
            <p className="text-lg font-semibold text-primary flex items-center justify-center gap-2">
              <Emoji3D emoji="🙏" size={24} /> THANK YOU! <Emoji3D emoji="🙏" size={24} />
            </p>
            <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
              Your feedback helps us improve our services. <Emoji3D emoji="💙" size={18} className="inline-flex" />
            </p>
          </div>
        </form>
      </div>
    </main>
  )
}
