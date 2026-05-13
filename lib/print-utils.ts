import { FeedbackPrintSnapshot } from '@/lib/csm-print-template'

/**
 * Generates an HTML document from the server and immediately triggers the system print dialog
 * @param snapshot - The feedback data snapshot
 * @param submittedDate - The submission date
 * @param logoUrl - The TESDA logo URL
 */
export const triggerSystemPrint = async (
  snapshot: FeedbackPrintSnapshot,
  submittedDate: string,
  logoUrl: string
) => {
  try {
    // Call the API to generate the HTML
    const response = await fetch('/api/print-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snapshot,
        submittedDate,
        logoUrl,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate document')
    }

    // Get the HTML blob
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    // Create an iframe to hold the HTML
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = url

    // Trigger print when the HTML is loaded
    iframe.onload = () => {
      // Give the browser a moment to render
      setTimeout(() => {
        iframe.contentWindow?.print()
      }, 100)
    }

    // Add iframe to DOM
    document.body.appendChild(iframe)

    // Optional: Clean up after a delay (browser keeps the object URL alive during print)
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
      URL.revokeObjectURL(url)
    }, 500)
  } catch (error) {
    console.error('Error triggering system print:', error)
    alert('Failed to open print dialog. Please try again.')
  }
}
