import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { buildClientFeedbackPrintHtml } from '@/lib/csm-print-template'
import { createRateLimitResponse, enforceRateLimit, rejectIfRequestTooLarge } from '@/lib/request-protection'

// Simple HTML to PDF using server-side rendering
async function htmlToPdf(htmlString: string): Promise<Buffer> {
  // Since @react-pdf/renderer is React-based, we'll use html2pdf approach
  // But for now, we'll use a simpler workaround with the existing HTML template
  // by converting it to a blob via Node
  return Buffer.from(htmlString)
}

export async function POST(request: NextRequest) {
  try {
    const oversizedResponse = rejectIfRequestTooLarge(request, 256 * 1024)
    if (oversizedResponse) {
      return oversizedResponse
    }

    const burstLimit = await enforceRateLimit(request, {
      scope: 'print-feedback:burst',
      limit: 12,
      windowMs: 60 * 1000,
    })

    if (!burstLimit.allowed) {
      return createRateLimitResponse(burstLimit)
    }

    const sustainedLimit = await enforceRateLimit(request, {
      scope: 'print-feedback:sustained',
      limit: 60,
      windowMs: 15 * 60 * 1000,
    })

    if (!sustainedLimit.allowed) {
      return createRateLimitResponse(sustainedLimit)
    }

    const { snapshot, submittedDate, logoUrl } = await request.json()

    // Generate the HTML from the template
    const html = buildClientFeedbackPrintHtml(snapshot, submittedDate, logoUrl)

    // Return HTML wrapped for print (browser will convert to PDF when printing)
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline',
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    )
  }
}
