export type FeedbackPrintSnapshot = {
  submittedAt: string
  controlNumber: string
  dbId: number | null
  clientInfo: {
    office: string
    clientType: string
    name: string
    sex: string
    age: string
    regionOfResidence: string
    province: string
    municipality: string
    citizensCharterService: string
    transactionTypes: string[]
  }
  ccQuestions: {
    cc1: string
    cc2: string
    cc3: string
  }
  sqd: Record<string, string>
  suggestions: {
    suggestions: string
    email: string
    employeeName: string
  }
}

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;")

const sqdQuestionLabels: Record<string, string> = {
  sqd0: "SQD0. I am satisfied with the service that I availed.",
  sqd1: "SQD1. I spent a reasonable amount of time for my transaction.",
  sqd2: "SQD2. The office followed the transaction requirements and steps based on the information provided.",
  sqd3: "SQD3. The steps and payment were easy and simple.",
  sqd4: "SQD4. I easily found information about my transaction from the office or website.",
  sqd5: "SQD5. I paid a reasonable amount of fees for my transaction.",
  sqd6: "SQD6. I feel that the office was fair to everyone and did not discriminate.",
  sqd7: "SQD7. I was treated courteously by the staff and they were helpful.",
  sqd8: "SQD8. I got what I needed from the government office, or if denied, the reason was explained clearly.",
}

export const buildClientFeedbackPrintHtml = (
  snapshot: FeedbackPrintSnapshot,
  submittedDate: string,
  logoUrl: string,
) => {
  const mark = (checked: boolean) => (checked ? "&#10004;" : "&nbsp;")
  const ccMark = (checked: boolean) => (checked ? "&#9745;" : "&#9744;")

  const normalizedClientType = (snapshot.clientInfo.clientType || "").toLowerCase()
  const isCitizen = normalizedClientType.includes("citizen")
  const isBusiness = normalizedClientType.includes("business")
  const isGovernment = normalizedClientType.includes("government")

  const normalizedSex = (snapshot.clientInfo.sex || "").toLowerCase()
  const isMale = normalizedSex === "male"
  const isFemale = normalizedSex === "female"

  const tx = snapshot.clientInfo.transactionTypes.map((t) => t.toLowerCase())
  const txHas = (label: string) => tx.some((item) => item.includes(label.toLowerCase()))

  const cc1Selected = snapshot.ccQuestions.cc1 || ""
  const cc2Selected = snapshot.ccQuestions.cc2 || ""
  const cc3Selected = snapshot.ccQuestions.cc3 || ""

  const originMatch = logoUrl.match(/^https?:\/\/[^/]+/)
  const assetBase = originMatch ? originMatch[0] : ""

  const sqdScaleColumns = [
    { key: "1", label: "Strongly Disagree", icon: `${assetBase}/SQD/strong%20disagree.png` },
    { key: "2", label: "Disagree", icon: `${assetBase}/SQD/disagree.png` },
    { key: "3", label: "Neither Agree nor Disagree", icon: `${assetBase}/SQD/neutral.png` },
    { key: "4", label: "Agree", icon: `${assetBase}/SQD/agree.png` },
    { key: "5", label: "Strongly Agree", icon: `${assetBase}/SQD/strong%20agree.png` },
    { key: "na", label: "Not Applicable", icon: "" },
  ]

  const sqdHeaderCells = sqdScaleColumns
    .map(
      (col) => `<th>
          <div class="sqd-head-wrap">
            ${col.icon
              ? `<img src="${escapeHtml(col.icon)}" class="sqd-head-icon" alt="${escapeHtml(col.label)}" />`
              : `<span class="sqd-head-icon-spacer"></span>`}
            <span class="sqd-head-label">${escapeHtml(col.label)}</span>
          </div>
        </th>`,
    )
    .join("")

  const sqdGridRows = Object.entries(sqdQuestionLabels)
    .map(([key, label], index) => {
      const selected = (snapshot.sqd[key] || "na").toLowerCase()
      const cells = sqdScaleColumns
        .map((col) => `<td class="sqd-cell">${selected === col.key ? "&#10004;" : ""}</td>`)
        .join("")

      return `<tr>
          <td class="sqd-question"><strong>Service Quality Dimension ${index}.</strong> ${escapeHtml(label.replace(/^SQD\\d\\.\\s*/, ""))}</td>
          ${cells}
        </tr>`
    })
    .join("")

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>CSM Client Feedback Copy</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: .5in;
        padding: 12px;
        color: #111827;
        font-family: Arial, Helvetica, sans-serif;
        background: #fff;
      }
      .sheet {
        max-width: 780px;
        margin: 0 auto;
        padding: 10px 14px;
        border: 1px solid #d1d5db;
      }
      .topline {
        font-size: 13px;
        margin-bottom: 2px;
      }
      .logo-wrap {
        text-align: center;
        margin-top: 2px;
      }
      .logo {
        width: 58px;
        height: 58px;
      }
      .agency {
        text-align: center;
        font-size: 16px;
        font-weight: 700;
        margin-top: 2px;
      }
      .agency-small {
        text-align: center;
        font-size: 12px;
        margin-top: 1px;
      }
      .notice {
        font-size: 11px;
        line-height: 1.3;
        margin: 10px 0;
      }
      .line-row {
        display: grid;
        grid-template-columns: auto 1fr auto 1fr auto 80px;
        gap: 6px;
        font-size: 11px;
        margin-bottom: 6px;
        align-items: end;
      }
      .line-row-2 {
        display: grid;
        grid-template-columns: auto 1fr auto 1.2fr;
        gap: 6px;
        font-size: 11px;
        margin-bottom: 6px;
        align-items: end;
      }
      .line-row-3 {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 6px;
        font-size: 11px;
        margin-bottom: 2px;
        align-items: start;
      }
      .line-break {
        border-bottom: 1px solid #111827;
        margin-bottom: 6px;
      }
      .fill {
        border-bottom: 1px solid #111827;
        min-height: 14px;
        padding: 0 2px 1px;
        font-size: 11px;
      }
      .checks {
        font-size: 11px;
        margin-bottom: 6px;
      }
      .checks .box {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 1px solid #111827;
        text-align: center;
        line-height: 10px;
        margin: 0 3px 0 6px;
        font-size: 10px;
        vertical-align: middle;
      }
      .line-row-3 .checks {
        line-height: 1.35;
      }
      .line-row-3 .checks .box:first-of-type {
        margin-left: 0;
      }
      .section-title {
        font-size: 11px;
        margin: 10px 0 4px;
      }
      .cc-block {
        font-size: 11px;
        margin-bottom: 7px;
      }
      .cc-head {
        display: grid;
        grid-template-columns: 44px 1fr;
        gap: 8px;
        margin-bottom: 2px;
      }
      .cc-options {
        margin-left: 52px;
      }
      .cc-options div {
        margin: 2px 0;
      }
      .sqd-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10px;
        margin-top: 6px;
      }
      .sqd-table th,
      .sqd-table td {
        border: 1px solid #6b7280;
        vertical-align: top;
      }
      .sqd-table td {
        padding: 4px;
      }
      .sqd-table th {
        padding: 2px 1px;
        text-align: center;
        font-weight: 700;
        vertical-align: top;
      }
      .sqd-head-wrap {
        display: grid;
        grid-template-rows: 42px auto;
        align-items: start;
        justify-items: center;
        row-gap: 2px;
      }
      .sqd-head-label {
        line-height: 1.05;
        margin: 0;
      }
      .sqd-head-icon {
        width: 42px;
        height: 42px;
        object-fit: contain;
        display: block;
      }
      .sqd-head-icon-spacer {
        width: 42px;
        height: 42px;
        display: block;
      }
      .sqd-question {
        width: 41%;
        font-size: 10px;
      }
      .sqd-cell {
        width: 9.8%;
        text-align: center;
        font-size: 12px;
        font-weight: 700;
        vertical-align: middle;
      }
      .footer-line {
        margin-top: 10px;
        font-size: 11px;
      }
      .thank {
        text-align: center;
        font-weight: 700;
        margin-top: 6px;
      }
      @media print {
        @page { size: A4 portrait; margin: 8mm; }
        body { padding: 0; }
        .sheet {
          border: 0;
          max-width: none;
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="topline"><strong>Control No:</strong> ${escapeHtml(snapshot.controlNumber || "N/A")}</div>

      <div class="logo-wrap">
        <img src="${escapeHtml(logoUrl)}" class="logo" alt="TESDA Logo" />
      </div>
      <div class="agency-small">TECHNICAL EDUCATION AND SKILLS DEVELOPMENT AUTHORITY</div>
      <div class="agency">HELP US SERVE YOU BETTER!</div>

      <div class="notice">
        This Client Satisfaction Measurement (CSM) tracks the customer experience of government offices. Your feedback on your recently concluded transaction will help this office provide a better service. Personal information shared will be kept confidential and you always have the option to not answer this form.
      </div>

      <div class="checks">
        Client type:
        <span class="box">${mark(isCitizen)}</span>Citizen
        <span class="box">${mark(isBusiness)}</span>Business
        <span class="box">${mark(isGovernment)}</span>Government (Employee or another agency)
      </div>

      <div class="line-row">
        <div>Date:</div>
        <div class="fill">${escapeHtml(submittedDate)}</div>
        <div>Name (Optional)</div>
        <div class="fill">${escapeHtml(snapshot.clientInfo.name || "")}</div>
        <div>Sex: ${ccMark(isMale)} Male ${ccMark(isFemale)} Female</div>
        <div>Age: <span class="fill">${escapeHtml(snapshot.clientInfo.age || "")}</span></div>
      </div>

      <div class="line-row-2">
        <div>Region of residence:</div>
        <div class="fill">${escapeHtml(snapshot.clientInfo.regionOfResidence || "")}</div>
        <div>Citizens Charter Service Availed:</div>
        <div class="fill">${escapeHtml(snapshot.clientInfo.citizensCharterService || "")}</div>
      </div>

      <div class="line-row-3">
        <div>Type of Transaction:</div>
        <div class="checks">
          <span class="box">${mark(txHas("Assessment"))}</span>Assessment and Certification
          <span class="box">${mark(txHas("Program Registration"))}</span>Program Registration
          <span class="box">${mark(txHas("Training"))}</span>Training
          <span class="box">${mark(txHas("Scholarship"))}</span>Scholarship
          <span class="box">${mark(txHas("Admin"))}</span>Administrative
          <span class="box">${mark(txHas("Others"))}</span>Others
        </div>
      </div>
      <div class="line-break"></div>

      <div class="section-title"><strong>INSTRUCTIONS:</strong> Check mark (&#10004; ) your answer to the Citizen's Charter (CC) questions. The Citizen's Charter is an official document that reflects the services of a government agency/office including its requirements, fees, and processing times among others.</div>

      <div class="cc-block">
        <div class="cc-head"><div><strong>CC1</strong></div><div>Which of the following best describes your awareness of a CC?</div></div>
        <div class="cc-options">
          <div>${ccMark(cc1Selected === "1")} 1. I know what a CC is and I saw this office's CC.</div>
          <div>${ccMark(cc1Selected === "2")} 2. I know what a CC is but I did NOT see this office's CC.</div>
          <div>${ccMark(cc1Selected === "3")} 3. I learned of the CC only when I saw this office's CC.</div>
          <div>${ccMark(cc1Selected === "4")} 4. I do not know what a CC is and I did not see one in this office.</div>
        </div>
      </div>

      <div class="cc-block">
        <div class="cc-head"><div><strong>CC2</strong></div><div>If aware of CC (answered 1-3 in CC1), would you say that the CC of this office was...?</div></div>
        <div class="cc-options">
          <div>${ccMark(cc2Selected === "1")} 1. Easy to see</div>
          <div>${ccMark(cc2Selected === "2")} 2. Somewhat easy to see</div>
          <div>${ccMark(cc2Selected === "3")} 3. Difficult to see</div>
          <div>${ccMark(cc2Selected === "4")} 4. Not visible at all</div>
          <div>${ccMark(cc2Selected === "5" || cc2Selected.toUpperCase() === "N/A")} 5. N/A</div>
        </div>
      </div>

      <div class="cc-block">
        <div class="cc-head"><div><strong>CC3</strong></div><div>If aware of CC (answered 1-3 in CC1), how much did the CC help you in your transaction?</div></div>
        <div class="cc-options">
          <div>${ccMark(cc3Selected === "1")} 1. Helped very much</div>
          <div>${ccMark(cc3Selected === "2")} 2. Somewhat helped</div>
          <div>${ccMark(cc3Selected === "3")} 3. Did not help</div>
          <div>${ccMark(cc3Selected === "4" || cc3Selected.toUpperCase() === "N/A")} 4. N/A</div>
        </div>
      </div>

      <div class="section-title"><strong>INSTRUCTIONS:</strong><br />For SQD 0-8, place a check mark (/) on the column that best corresponds to your answer.</div>

      <table class="sqd-table">
        <tr>
          <th class="sqd-question"></th>
          ${sqdHeaderCells}
        </tr>
        ${sqdGridRows}
      </table>

      <div class="footer-line">Suggestions on how we can further improve our services (optional):</div>
      <div class="fill">${escapeHtml(snapshot.suggestions.suggestions || "")}</div>

      <div class="line-row-2" style="margin-top: 8px;">
        <div>Email address (optional):</div>
        <div class="fill">${escapeHtml(snapshot.suggestions.email || "")}</div>
        <div>Employee's Full Name:</div>
        <div class="fill">${escapeHtml(snapshot.suggestions.employeeName || "")}</div>
      </div>

      <div class="thank">THANK YOU!</div>
    </div>
  </body>
</html>`
}
