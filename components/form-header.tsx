"use client"

import { memo } from "react"

import { Emoji3D } from "@/components/emoji-3d"

export const FormHeader = memo(function FormHeader({ office }: { office?: string }) {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-3 mb-4">
        <img src="/tesda-logo.png" alt="TESDA Logo" className="w-20 h-20 object-contain" />
      </div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
        Technical Education and Skills Development Authority
      </p>

      {office && (
        <div className="inline-flex items-center justify-center px-5 py-2 mb-6 rounded-full bg-blue-50 border border-blue-100 shadow-sm">
          <span className="text-sm font-extrabold text-blue-700 tracking-wider">
            {office}
          </span>
        </div>
      )}

      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3 text-balance flex items-center justify-center gap-2">
        <Emoji3D emoji="🌟" size={32} /> Help Us Serve You Better! <Emoji3D emoji="🌟" size={32} />
      </h1>
      <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        This Client Satisfaction Measurement (CSM) tracks the customer experience of government offices.
        Your feedback on your recently concluded transaction will help this office provide a better service.
        Personal information shared will be kept confidential and you always have the option to not answer this form. <Emoji3D emoji="🔒" size={18} className="inline-flex" />
      </p>
    </div>
  )
})
