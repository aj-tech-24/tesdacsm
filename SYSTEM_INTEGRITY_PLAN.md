# System Integrity and Bias Prevention Plan

Ensuring the integrity of a Client Satisfaction Measurement (CSM) system and removing bias is a multi-layered challenge. In an institutional setting like TESDA, the primary risks are **staff manipulating submissions** (submitting fake positive reviews), **clients fearing retaliation** (not leaving honest feedback), and **admins cherry-picking data** for reports.

Here is a detailed, ideal technical and architectural plan to implement zero-bias and strict data integrity in the Next.js/Prisma system:

## 1. Data Collection Level (Preventing Submission Bias)

*   **Decoupled Submission (The "Own Device" Policy):** 
    *   *Issue:* Kiosks at the counter can be easily manipulated by staff when no one is looking, or clients feel watched while typing.
    *   *Solution:* Generate dynamic, time-limited QR codes printed on transaction receipts or queue tickets. Clients scan the QR code to submit feedback on their own smartphones after leaving the premises.
*   **Rate Limiting & Device Fingerprinting:**
    *   *Implementation:* In the `/api/submit-feedback/route.ts`, implement Redis-based rate limiting (e.g., using `@upstash/ratelimit`). Block IPs or browser fingerprints (using libraries like `fingerprintjs`) that submit more than an acceptable threshold (e.g., 2 submissions per day per device).
*   **Bot & Spam Prevention:**
    *   *Implementation:* Integrate **Cloudflare Turnstile** or **Google reCAPTCHA v3** (invisible) on the submission page. This ensures automated scripts aren't being used to inflate positive metrics.
*   **Strict Anonymity Guarantees:**
    *   Make personal identifiers (`name`, `contact`) truly optional in the Prisma schema. Add a prominent UI disclaimer assuring clients that their demographics are detached from their transaction identity.

## 2. Database & Data Integrity Level (Tamper-Proofing)

*   **Append-Only / Immutable Records:**
    *   *Implementation:* Once a feedback entry is created in the database, it should never be modified. Remove all `UPDATE` capabilities for feedback records in the API routes.
*   **Soft Deletion with Audit Trails:**
    *   *Implementation:* If a feedback contains severe profanity and must be hidden, it should be "Soft Deleted" (`isHidden: true` in schema) rather than actually DELETED from the database.
    *   Create an `AuditLog` model in `schema.prisma`. Use **Prisma Client Extensions** or Middleware to automatically log who (which Admin ID) hid the feedback, at what timestamp, and the required `reason`.
*   **Database Row Level Security (RLS) / Permissions:**
    *   Ensure regular admins (e.g., at the Provincial Office level) only have `READ` access to their specific branch's data. Only super-admins have global read access. Absolutely no one has `DELETE` access to the raw data table.

## 3. Analysis & Processing Level (Removing Human Bias)

*   **AI/Automated Sentiment Analysis:**
    *   *Issue:* When staff manually categorize qualitative comments ("Suggestions"), they might classify a negative comment as "Neutral" to protect their branch.
    *   *Solution:* Run comments through a standardized LLM or sentiment analysis API (like OpenAI or AWS Comprehend) upon submission. The system automatically tags it as `Positive`, `Neutral`, or `Negative`. Admins cannot override this tag.
*   **Blind Processing:**
    *   When generating the ARTA (Anti-Red Tape Authority) required metrics (SQD0 to SQD8), the calculation must be strictly algorithmic. Do not provide a UI feature that lets admins "select which dates to exclude" (unless explicitly logged and flagged as an excluded anomaly report).

## 4. Reporting & Transparency Level

*   **Cryptographic Hashing / Export Integrity:**
    *   When an admin exports the CSM data to Excel/PDF (via the `csm-print-template.ts` or `xlsx-populate`), generate a SHA-256 hash of the dataset and print that hash on the footer of the document. This proves the exported report hasn't been manually altered in Excel after download.
*   **Public/Internal Transparency Dashboard:**
    *   Create a high-level read-only dashboard that shows raw aggregates (Total entries, overall score) that regional directors can see independently of the local office administrators.

---

### Recommended Next Steps for Implementation:

1.  **Update `schema.prisma`:**
    ```prisma
    model Feedback {
      id          String   @id @default(cuid())
      // ... existing fields ...
      ipHash      String?  // Hashed IP for rate limiting without storing PII
      isHidden    Boolean  @default(false) // Instead of deletion
      hideReason  String?
      createdAt   DateTime @default(now())
      updatedAt   DateTime @updatedAt // Should rarely be used
    }

    model AuditLog {
      id          String   @id @default(cuid())
      adminId     String
      action      String   // e.g., "HIDE_FEEDBACK"
      targetId    String
      reason      String
      timestamp   DateTime @default(now())
    }
    ```
2.  **Add Rate Limiting to Submission Route:** Protect `/api/submit-feedback/route.ts` against rapid-fire submissions.
3.  **Standardize Survey Language:** Ensure the UI in `components/service-quality-section.tsx` strictly adheres to the neutral ARTA-mandated language to avoid user-prompting bias.
