"use client"

import { memo } from "react"
import { useState, useMemo, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Emoji3D } from "@/components/emoji-3d"
import { cn } from "@/lib/utils"
import { User, Calendar, MapPin, Briefcase, FileText } from "lucide-react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { getServicesForOfficeAndTransactions } from "@/lib/services-data"

const transactionTypes = [
  { id: "assessment", label: "Assessment and Certification", emoji: "📋" },
  { id: "program", label: "Program Registration", emoji: "📝" },
  { id: "training", label: "Training", emoji: "🎓" },
  { id: "scholarship", label: "Scholarship", emoji: "🏅" },
  { id: "administrative", label: "Administrative", emoji: "🗂️" },
  { id: "others", label: "Others", emoji: "➕" },
]

const clientTypes = [
  { value: "Citizen", label: "Citizen", emoji: "🪪" },
  { value: "Business", label: "Business", emoji: "🏢" },
  { value: "Government (Employee or another agency)", label: "Government", emoji: "🏛️" },
]

const regionOptions = [
  "NCR",
  "CAR",
  "Region I",
  "Region II",
  "Region III",
  "Region IV-A",
  "Region IV-B",
  "Region V",
  "Region VI",
  "Region VII",
  "Region VIII",
  "Region IX",
  "Region X",
  "Region XI",
  "Region XII",
  "Region XIII",
  "BARMM",
]

interface ClientInfoSectionProps {
  formData: {
    office: string
    clientType: string
    date: string
    name: string
    sex: string
    age: string
    regionOfResidence: string
    citizensCharterService: string
    transactionTypes: string[]
    province?: string
    municipality?: string
  }
  onChange: (field: string, value: string | string[]) => void
}

export const ClientInfoSection = memo(function ClientInfoSection({ formData, onChange }: ClientInfoSectionProps) {
  // const [othersText, setOthersText] = useState("")

  // const isOthersChecked = formData.transactionTypes.includes("Others")
  const [isCustomService, setIsCustomService] = useState(false)

  const availableServiceGroups = useMemo(() => {
    return getServicesForOfficeAndTransactions(formData.office, formData.transactionTypes)
  }, [formData.office, formData.transactionTypes])

  // Clear or adjust selected service if it's no longer in the list of available services
  const prevGroupsRef = useRef(availableServiceGroups);
  useEffect(() => {
    if (prevGroupsRef.current !== availableServiceGroups) {
      prevGroupsRef.current = availableServiceGroups;
      setIsCustomService(false); // Reset custom service input when transactions change
      onChange("citizensCharterService", "");
    }
  }, [availableServiceGroups, onChange]);

  const handleTransactionTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      onChange("transactionTypes", [type])
    } else {
      onChange("transactionTypes", [])
    }
  }

  const selectedRegionValue = regionOptions.includes(formData.regionOfResidence)
    ? formData.regionOfResidence
    : "__OTHER__"

  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-card-foreground">
          <Emoji3D emoji="👤" size={28} />
          Client Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Client Type – card selector */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-card-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Client Type
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {clientTypes.map((type) => {
              const isSelected = formData.clientType === type.value
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => onChange("clientType", type.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer text-center",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-background hover:border-primary/40 hover:bg-muted/50"
                  )}
                >
                  <Emoji3D emoji={type.emoji} size={40} />
                  <span className={cn(
                    "text-xs font-medium leading-tight",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )}>
                    {type.label}
                  </span>
                  {/* Hidden radio for form semantics */}
                  <input
                    type="radio"
                    name="clientType"
                    value={type.value}
                    checked={isSelected}
                    onChange={() => onChange("clientType", type.value)}
                    className="sr-only"
                  />
                </button>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/60" />

        {/* Personal Info Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Date */}
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="date" className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Date
            </Label>
            <div className="relative">
              <Input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => onChange("date", e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2 md:col-span-4">
            <Label htmlFor="name" className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Name

            </Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => onChange("name", e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Sex */}
          <div className="space-y-2 md:col-span-3">
            <Label className="text-sm font-semibold text-card-foreground">Sex</Label>
            <RadioGroup
              value={formData.sex}
              onValueChange={(value) => onChange("sex", value)}
              className="flex gap-3 pt-1"
            >
              {[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={opt.value} />
                  <Label htmlFor={opt.value} className="text-sm font-normal cursor-pointer text-card-foreground">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Age */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="age" className="text-sm font-semibold text-card-foreground">Age</Label>
            <Input
              type="number"
              id="age"
              placeholder="Age"
              min="1"
              max="120"
              value={formData.age}
              onChange={(e) => onChange("age", e.target.value)}
              className="bg-background max-w-[90px]"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/60" />

        {/* Transaction Types */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-card-foreground flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            Type of Transaction
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {transactionTypes.map((type) => {
              const isChecked = formData.transactionTypes.includes(type.label)
              return (
                <label
                  key={type.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                    isChecked
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/40 hover:bg-muted/50"
                  )}
                >
                  <Checkbox
                    id={type.id}
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleTransactionTypeChange(type.label, checked as boolean)
                    }
                    className="shrink-0"
                  />
                  <Emoji3D emoji={type.emoji} size={24} />
                  <span className={cn(
                    "text-sm font-medium leading-tight",
                    isChecked ? "text-primary" : "text-card-foreground"
                  )}>
                    {type.label}
                  </span>
                </label>
              )
            })}
          </div>

          {/* Others input – temporarily removed as requested */}
        </div>

        {/* Divider */}
        <div className="border-t border-border/60" />

        {/* Region and Service */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="region" className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Region of Residence
            </Label>
            <Select
              value={selectedRegionValue || "Region XI"}
              onValueChange={(value) => {
                if (value === "__OTHER__") {
                  onChange("regionOfResidence", "")
                  return
                }
                onChange("regionOfResidence", value)
              }}
            >
              <SelectTrigger id="region" className="w-full bg-background min-h-10">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {regionOptions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
                <SelectItem value="__OTHER__">Others</SelectItem>
              </SelectContent>
            </Select>
            {selectedRegionValue === "__OTHER__" && (
              <Input
                id="region-other"
                placeholder="Enter your region"
                value={formData.regionOfResidence}
                onChange={(e) => onChange("regionOfResidence", e.target.value)}
                className="bg-background"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="service" className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Citizens Charter Service Availed
            </Label>
            {formData.transactionTypes.length === 0 ? (
              <Input
                id="service"
                placeholder="Please select a transaction type first"
                disabled
                value={formData.citizensCharterService || ""}
                className="bg-muted text-muted-foreground"
              />
            ) : availableServiceGroups.length === 0 ? (
              <Input
                id="service"
                placeholder="Please specify your service..."
                value={formData.citizensCharterService || ""}
                onChange={(e) => onChange("citizensCharterService", e.target.value)}
                className="bg-background"
              />
            ) : isCustomService ? (
              <div className="flex gap-2">
                <Input
                  id="service"
                  placeholder="Please specify your service..."
                  value={formData.citizensCharterService || ""}
                  onChange={(e) => onChange("citizensCharterService", e.target.value)}
                  className="bg-background"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCustomService(false);
                    onChange("citizensCharterService", "");
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Select
                value={formData.citizensCharterService}
                onValueChange={(value) => {
                  if (value === "___CUSTOM___") {
                    setIsCustomService(true);
                    onChange("citizensCharterService", "");
                  } else {
                    onChange("citizensCharterService", value);
                  }
                }}
              >
                <SelectTrigger className="w-full bg-background min-h-10">
                  <SelectValue placeholder="Select a service..." />
                </SelectTrigger>
                <SelectContent>
                  {availableServiceGroups.map((group) => (
                    <SelectGroup key={group.category}>
                      <SelectLabel className="font-semibold text-primary/80">{group.category}</SelectLabel>
                      {group.services.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                  <SelectItem value="___CUSTOM___" className="font-medium text-primary">
                    Others (Please specify)
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Province and Municipality for Region XI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="province" className="text-sm font-semibold text-card-foreground">
              Province
            </Label>
            <Input
              id="province"
              placeholder="Enter Province"
              value={formData.province || ""}
              onChange={(e) => onChange("province", e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="municipality" className="text-sm font-semibold text-card-foreground">
              Municipality / City
            </Label>
            <Input
              id="municipality"
              placeholder="Enter Municipality / City"
              value={formData.municipality || ""}
              onChange={(e) => onChange("municipality", e.target.value)}
              className="bg-background"
            />
          </div>
        </div>

      </CardContent>
    </Card>
  )
})
