"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { FormHeader } from "@/components/form-header"
import { ClientInfoSection } from "@/components/client-info-section"
import { CitizensCharterSection } from "@/components/citizens-charter-section"
import { ServiceQualitySection } from "@/components/service-quality-section"
import { SuggestionsSection } from "@/components/suggestions-section"
import { OfficeSelection } from "@/components/office-selection"
import { Emoji3D, FLUENT_EMOJI_OPTIONS } from "@/components/emoji-3d"
import { buildClientFeedbackPrintHtml, type FeedbackPrintSnapshot } from "@/lib/csm-print-template"
import { Send, ArrowLeft, Users, Award, Building2, MousePointerClick } from "lucide-react"
import * as LucideIcons from "lucide-react"
import * as HeroIcons from "@heroicons/react/24/outline"

const SELECTED_OFFICE_KEY = "selectedOffice"
const ACHIEVEMENTS_VERSION_KEY = "achievementsVersion"
const ACHIEVEMENTS_VERSION_CHANNEL = "achievementsVersionChannel"
const IDLE_TIMEOUT_MS = 20_000

type ScreensaverAchievement = {
  title: string
  detail: string
  imagePath?: string | null
  iconName?: string | null
}

const DEFAULT_TESDA_ACHIEVEMENTS: ScreensaverAchievement[] = [
  {
    title: "Customer Service Excellence",
    detail: "Strengthened front-line support for TVET clients across Davao del Sur transactions.",
  },
  {
    title: "Training Program Expansion",
    detail: "Expanded competency-based programs to reach more communities and partner institutions.",
  },
  {
    title: "Assessment and Certification Reach",
    detail: "Increased opportunities for workers and learners to earn recognized TESDA certifications.",
  },
  {
    title: "Industry and LGU Partnerships",
    detail: "Sustained collaboration with local stakeholders to align training with workforce needs.",
  },
  {
    title: "Continuous Service Improvement",
    detail: "Used client feedback and CSM insights to improve service delivery quality and responsiveness.",
  },
]

const getStoredOffice = () => {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(SELECTED_OFFICE_KEY) || ""
}

export default function ClientSatisfactionForm() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOfficeReady, setIsOfficeReady] = useState(false)
  const [submittedSnapshot, setSubmittedSnapshot] = useState<FeedbackPrintSnapshot | null>(null)
  const [isIdleScreensaverVisible, setIsIdleScreensaverVisible] = useState(false)
  const [screensaverAchievements, setScreensaverAchievements] = useState<ScreensaverAchievement[]>(DEFAULT_TESDA_ACHIEVEMENTS)
  const [achievementsVersion, setAchievementsVersion] = useState("0")
  const idleTimerRef = useRef<number | null>(null)

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
    transactionTypes: [] as string[],
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

  const handleClientInfoChange = useCallback((field: string, value: string | string[] | boolean) => {
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

  const hideScreensaver = useCallback(() => {
    setIsIdleScreensaverVisible(false)
  }, [])

  const restartIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current)
    }
    idleTimerRef.current = window.setTimeout(() => {
      setIsIdleScreensaverVisible(true)
    }, IDLE_TIMEOUT_MS)
  }, [])

  useEffect(() => {
    const handleClickDismiss = () => {
      if (isIdleScreensaverVisible) {
        hideScreensaver()
      }
    }

    const handleActivity = () => {
      restartIdleTimer()
    }

    // Only click dismisses the screensaver
    window.addEventListener("click", handleClickDismiss, { passive: true })

    // All other activities restart the idle timer
    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ]

    for (const eventName of events) {
      window.addEventListener(eventName, handleActivity, { passive: true })
    }

    restartIdleTimer()

    return () => {
      window.removeEventListener("click", handleClickDismiss)
      for (const eventName of events) {
        window.removeEventListener(eventName, handleActivity)
      }
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current)
      }
    }
  }, [hideScreensaver, isIdleScreensaverVisible, restartIdleTimer])



  const loadAchievements = useCallback(async (signal?: AbortSignal) => {
    try {
      const version = achievementsVersion
      const response = await fetch(`/api/achievements?v=${encodeURIComponent(version)}`, {
        cache: "no-store",
        signal,
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success) return

      const mapped = (payload.items || [])
        .map((item: any) => ({
          title: String(item?.title || "").trim(),
          detail: String(item?.description || "").trim(),
          imagePath: item?.imagePath ? String(item.imagePath) : null,
          iconName: item?.iconName ? String(item.iconName) : null,
        }))
        .filter((item: ScreensaverAchievement) => item.title && item.detail)

      if (mapped.length > 0) {
        setScreensaverAchievements(mapped)
      }
    } catch (error) {
      if ((error as any)?.name !== "AbortError") {
        // Keep defaults when API call fails.
      }
    }
  }, [achievementsVersion])

  useEffect(() => {
    const controller = new AbortController()
    void loadAchievements(controller.signal)

    return () => {
      controller.abort()
    }
  }, [loadAchievements])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== ACHIEVEMENTS_VERSION_KEY) return
      setAchievementsVersion(event.newValue || "0")
    }

    const channel = typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel(ACHIEVEMENTS_VERSION_CHANNEL)
      : null

    const handleMessage = (event: MessageEvent) => {
      setAchievementsVersion(String(event.data || "0"))
    }

    window.addEventListener("storage", handleStorage)
    channel?.addEventListener("message", handleMessage)

    return () => {
      window.removeEventListener("storage", handleStorage)
      channel?.removeEventListener("message", handleMessage)
      channel?.close()
    }
  }, [loadAchievements])

  useEffect(() => {
    if (typeof window === "undefined") return

    let lastVersion = localStorage.getItem(ACHIEVEMENTS_VERSION_KEY) || "0"
    const interval = window.setInterval(() => {
      const nextVersion = localStorage.getItem(ACHIEVEMENTS_VERSION_KEY) || "0"
      if (nextVersion !== lastVersion) {
        lastVersion = nextVersion
        setAchievementsVersion(nextVersion)
      }
    }, 1000)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isIdleScreensaverVisible) return

    const controller = new AbortController()
    void loadAchievements(controller.signal)

    return () => {
      controller.abort()
    }
  }, [isIdleScreensaverVisible, loadAchievements, achievementsVersion])

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
          formDate: clientInfo.date,
          clientInfo: {
            office: clientInfo.office,
            clientType: clientInfo.clientType,
            name: clientInfo.name,
            sex: clientInfo.sex,
            age: clientInfo.age,
            regionOfResidence: clientInfo.regionOfResidence,
            province: clientInfo.province,
            municipality: clientInfo.municipality,
            formDate: clientInfo.date,
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
      transactionTypes: [],
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
        {isIdleScreensaverVisible && (
          <IdleAchievementsScreensaver
            achievements={screensaverAchievements}
            onWake={hideScreensaver}
          />
        )}
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
      <main className="relative min-h-screen bg-background py-8 px-4">
        {isIdleScreensaverVisible && (
          <IdleAchievementsScreensaver
            achievements={screensaverAchievements}
            onWake={hideScreensaver}
          />
        )}
      </main>
    )
  }

  if (!clientInfo.office) {
    return (
      <>
        {isIdleScreensaverVisible && (
          <IdleAchievementsScreensaver
            achievements={screensaverAchievements}
            onWake={hideScreensaver}
          />
        )}
        <OfficeSelection onSelect={(office) => handleClientInfoChange("office", office)} />
      </>
    )
  }

  return (
    <main className="relative min-h-screen bg-background py-8 px-4">
      {isIdleScreensaverVisible && (
        <IdleAchievementsScreensaver
          achievements={screensaverAchievements}
          onWake={hideScreensaver}
        />
      )}
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

// Map achievement keywords to lucide icons
function getIconForAchievement(achievement: ScreensaverAchievement) {
  if (achievement.iconName) {
    const hero = (HeroIcons as Record<string, any>)[achievement.iconName]
    if (hero) return hero
    const icon = (LucideIcons as Record<string, any>)[achievement.iconName]
    if (icon) return icon
  }

  const text = `${achievement.title} ${achievement.detail}`.toLowerCase()
  if (text.includes("graduate") || text.includes("student") || text.includes("people")) return Users
  if (text.includes("award") || text.includes("excellence") || text.includes("outstanding")) return Award
  if (text.includes("industry") || text.includes("partner") || text.includes("business")) return Building2
  return Award // fallback
}

function IdleAchievementsScreensaver({
  achievements,
  onWake,
}: {
  achievements: ScreensaverAchievement[]
  onWake: () => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || achievements.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % achievements.length)
    }, 6000) // rotate every 6 seconds

    return () => clearInterval(interval)
  }, [mounted, achievements.length])

  if (!mounted || achievements.length === 0) return null

  const currentAchievement = achievements[currentIndex]
  const Icon = getIconForAchievement(currentAchievement)

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black animate-fade-in flex items-center justify-center overflow-hidden"
      onClick={onWake}
      onMouseDown={onWake}
      onTouchStart={onWake}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onWake()
      }}
      aria-label="Idle screensaver showing TESDA Davao del Sur achievements. Tap to continue."
    >
      {/* Background Images */}
      {achievements.map((item, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1500 ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="absolute inset-0 bg-black/30 z-10" /> {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-10" />
          {item.imagePath ? (
            <img
              src={item.imagePath}
              alt={item.title}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[12000ms] ease-linear ${index === currentIndex ? 'scale-110' : 'scale-100'}`}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          )}
        </div>
      ))}

      {/* Content */}
      <div className="relative z-20 max-w-5xl mx-auto px-6 text-center space-y-8 mt-20">
        <div key={currentIndex} className="animate-achieve-content">
          <div className="inline-flex items-center justify-center w-36 h-36 md:w-44 md:h-44 mb-8">
            <Icon className="w-20 h-20 md:w-28 md:h-28 text-white" />
          </div>
          <div className="animate-achieve-text space-y-4">
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-2xl" style={{ fontFamily: 'var(--font-playfair, serif)', letterSpacing: '-0.02em' }}>
              {currentAchievement.title}
            </h2>
            <p className="text-lg md:text-2xl text-white/85 max-w-3xl mx-auto leading-relaxed drop-shadow-lg" style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontWeight: 500 }}>
              {currentAchievement.detail}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom interaction prompt */}
      <div className="absolute bottom-12 left-0 right-0 z-20 flex justify-center">
        <div className="animate-achieve-prompt flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 shadow-lg" style={{ fontFamily: 'var(--font-poppins, sans-serif)' }}>
          <MousePointerClick className="w-5 h-5" />
          <span className="font-medium tracking-wide">Press any key to return</span>
        </div>
      </div>
    </div>
  )
}

