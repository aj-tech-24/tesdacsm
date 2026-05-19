# Archive Feature Implementation Plan

## Overview
Add an **Archive** tab to the admin dashboard sidebar for managing feedback archives and bulk printing feedback forms by month.

---

## 1. Architecture Overview

### High-Level Structure
- Add "Archive" navigation tab to sidebar (alongside Overview, Actions, Analysis, Feedbacks)
- Create new `app/admin/archive/` folder with modular components
- Implement backend APIs for archive operations and monthly data retrieval

### Component Hierarchy
```
app/admin/archive/
├── page.tsx                    (Server component - data fetching)
├── ArchiveClient.tsx           (Client component - main UI wrapper)
├── archive-form.tsx            (Month selector & bulk action controls)
└── archive-card.tsx            (Individual month card display)
```

---

## 2. Database & Data Requirements

### Schema Considerations
- **Use existing**: `Feedback` table (no migrations required)
- **Field to consider adding**: `isArchived` boolean on Feedback model (optional, for tracking)
- **Alternative**: Track via Notification model pattern or separate Archive table

### Data Grouping
- Query feedbacks by month from `formDate` field (YYYY-MM format)
- Calculate per-month metrics:
  - Total feedback count
  - Answered feedback count (has SQD ratings or suggestions)
  - Archived count
  - Office breakdown

### "Answered" Definition
A feedback is considered "answered" if it has:
- At least one SQD rating (sqd0-sqd8) AND/OR
- Citizens Charter questions answered (cc1-cc3) AND/OR
- Suggestions provided

---

## 3. UI Components

### Archive Page Layout

#### **Main Container (ArchiveClient.tsx)**
- Tabs interface matching existing dashboard style
- Responsive grid layout for month cards
- Filter options (year selection, archive status)

#### **Month Card (archive-card.tsx)**
```
┌─────────────────────────────┐
│ May 2026                    │
├─────────────────────────────┤
│ 📊 Total: 79 Feedbacks     │
│ ✅ Answered: 72             │
│ 📁 Archived: 5              │
├─────────────────────────────┤
│ [Print] [Archive] [View]    │
└─────────────────────────────┘
```

**Card Information:**
- Month & year header
- Feedback count breakdown
- Status indicators (answered, archived, pending)
- Action buttons per month

#### **Archive Form (archive-form.tsx)**
- Year selector dropdown
- Month filter pills/tabs
- Bulk action controls:
  - Archive All (with confirmation)
  - Bulk Print Answered (with PDF options)
  - Export to CSV

#### **Features & Interactions**
- Status badges showing:
  - Answered vs Total ratio (e.g., "72/79")
  - Archive state indicator
  - Pending count if any
- Color-coded cards (green for full answered, yellow for partial, red for pending)
- Confirmation dialogs before destructive actions

---

## 4. Backend APIs

### New Routes Required

#### **1. GET `/api/admin/archive/monthly-summary`**
Retrieves summary statistics for all months

**Query Parameters:**
- `year` (optional) - Filter by specific year, default: all years
- `archived` (optional) - Filter by archive status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "month": "2026-05",
      "year": 2026,
      "monthName": "May",
      "total": 79,
      "answered": 72,
      "pending": 7,
      "archived": 5,
      "byOffice": {
        "PO": { "total": 30, "answered": 28 },
        "CCNTS": { "total": 25, "answered": 23 },
        "PTC-DS": { "total": 24, "answered": 21 }
      }
    }
  ]
}
```

---

#### **2. POST `/api/admin/archive/bulk-archive`**
Archives all feedbacks for a specific month

**Request Body:**
```json
{
  "year": 2026,
  "month": 5,
  "archiveAll": true
}
```

**Response:**
```json
{
  "success": true,
  "archived": 79,
  "message": "May 2026 feedbacks archived successfully"
}
```

---

#### **3. POST `/api/admin/archive/bulk-print`**
Generates PDF or print-ready HTML for answered feedbacks of a month

**Request Body:**
```json
{
  "year": 2026,
  "month": 5,
  "format": "pdf",
  "filterAnswered": true
}
```

**Response:**
- Returns PDF file (if format=pdf) OR
- Returns HTML blob for browser printing (if format=html)

---

#### **4. GET `/api/admin/archive/month-details/:month`**
Retrieves detailed feedback list for a specific month

**Response:**
```json
{
  "success": true,
  "month": "2026-05",
  "feedbacks": [
    {
      "id": 123,
      "controlNumber": "PO-2026-05-0001",
      "name": "John Doe",
      "office": "REGION XI/PROVINICAL OFFICE",
      "service": "Application for Assessment",
      "answered": true,
      "archived": false
    }
  ]
}
```

---

## 5. Print Functionality

### Integration Points
- Leverage existing `csm-print-template.ts` utilities
- Use existing print layout/styling from feedback forms

### Print Logic
1. **Filter**: Only select "answered" feedbacks
2. **Format**: Generate print-ready layout (PDF or HTML)
3. **Delivery**: 
   - Option A: Browser print dialog (HTML)
   - Option B: Direct PDF download
4. **Grouping**: By month or by office within month

### Print Template Fields
Use existing template but filtered for:
- Control number
- Client info (name, type, date)
- SQD ratings
- Citizens Charter responses
- Service info
- Suggestions

---

## 6. File Structure to Create

```
d:\Tesda Project\CSM\

app/
├── admin/
│   ├── archive/
│   │   ├── page.tsx                 (Server component)
│   │   ├── ArchiveClient.tsx        (Client component)
│   │   ├── archive-form.tsx         (Controls & filters)
│   │   └── archive-card.tsx         (Month card component)
│   └── dashboard/
│       └── DashboardClient.tsx       (UPDATE: Add Archive nav item)
│
└── api/admin/
    └── archive/
        ├── monthly-summary/
        │   └── route.ts
        ├── bulk-archive/
        │   └── route.ts
        ├── bulk-print/
        │   └── route.ts
        └── month-details/
            └── [month]
                └── route.ts
```

---

## 7. Implementation Features

### Core Functionality
✅ **Archive Feedbacks** - Mark entire month as archived  
✅ **Bulk Print** - Generate printable/PDF for answered feedbacks  
✅ **Monthly Dashboard** - View all months with status  
✅ **Month Summary** - Stats per month (total, answered, archived)  
✅ **Role-Based Access** - Super Admin + Office Admin filtering  
✅ **Confirmation Dialogs** - Safety for destructive actions  

### User Experience
✅ **Responsive Design** - Works on mobile & desktop  
✅ **Status Indicators** - Color-coded month cards  
✅ **Progress Feedback** - Loading states during operations  
✅ **Error Handling** - User-friendly error messages  
✅ **Undo Capability** - Consider soft-delete (unarchive option)  

### Integration
✅ **Sidebar Navigation** - Matches existing style  
✅ **Authentication** - Uses existing session.ts  
✅ **Print Integration** - Extends existing templates  
✅ **Office Filtering** - Respects user role permissions  

---

## 8. Sidebar Navigation Update

### In `DashboardClient.tsx` - Update `navItems` array:

```typescript
const navItems = [
  { value: "overview", label: "Overview", icon: BarChart3 },
  { value: "actions", label: "Actions", icon: ClipboardList },
  ...(userRole === "super_admin" ? [{ value: "analysis", label: "Analysis", icon: FileText }] : []),
  { value: "all-feedbacks", label: "Feedbacks", icon: Layers3 },
  { value: "archive", label: "Archive", icon: Archive },  // ADD THIS
];
```

**Icon Import:**
```typescript
import { Archive } from "lucide-react"  // Add to existing imports
```

---

## 9. Implementation Steps

### Phase 1: Setup & Navigation
1. ✅ Add Archive tab to sidebar navigation (DashboardClient.tsx)
2. ✅ Create `/app/admin/archive/page.tsx` (server component)
3. ✅ Create `/app/admin/archive/ArchiveClient.tsx` (client wrapper)

### Phase 2: UI Components
4. ✅ Create `archive-card.tsx` (month display card)
5. ✅ Create `archive-form.tsx` (month selector & controls)
6. ✅ Style matching existing dashboard theme

### Phase 3: Backend APIs
7. ✅ Implement `/api/admin/archive/monthly-summary`
8. ✅ Implement `/api/admin/archive/bulk-archive`
9. ✅ Implement `/api/admin/archive/bulk-print`
10. ✅ Implement `/api/admin/archive/month-details/[month]`

### Phase 4: Print Integration
11. ✅ Integrate with `csm-print-template.ts`
12. ✅ Add PDF generation (if needed)
13. ✅ Test print layout

### Phase 5: Testing & Refinement
14. ✅ E2E testing of archive workflow
15. ✅ Print output verification
16. ✅ Role-based access validation

---

## 10. Dependencies & Considerations

### Libraries/Tools
- **PDF Generation**: Consider `pdfkit` or use browser's print dialog
- **Date Handling**: Use existing date utilities
- **State Management**: React hooks (useState, useEffect, useMemo)

### Performance Considerations
- Pagination for month details (if many feedbacks)
- Caching monthly summaries
- Debounce bulk operations
- Database indexing on `formDate` field

### Security & Permissions
- Only super_admin can bulk-archive all
- Office_admin can archive their office only
- Audit trail for archive actions (consider logging)
- Confirm before archive/print

### Browser Compatibility
- Use standard print API (widely supported)
- PDF generation should work on all modern browsers
- Fallback to browser print dialog if PDF fails

---

## 11. Future Enhancements

- **Scheduled Archiving**: Auto-archive after 30/60/90 days
- **Archive Recovery**: Restore archived feedbacks
- **Export Formats**: CSV, Excel, JSON export
- **Archive History**: View what was archived and when
- **Batch Operations**: Archive multiple months at once
- **Email Reports**: Send monthly print summaries via email

---

## 12. Success Criteria

✅ Archive button visible in sidebar  
✅ Monthly summary displays correctly  
✅ Bulk archive operation completes without errors  
✅ Bulk print generates valid printable output  
✅ Role-based filtering works as expected  
✅ No impact on existing functionality  
✅ User confirmations prevent accidental operations  
✅ Error messages are clear and actionable  

---

## Notes

- Use existing design patterns from dashboard
- Maintain color scheme and component styling
- Follow TypeScript best practices
- Add proper error handling and logging
- Consider accessibility (WCAG 2.1 AA)
- Test across different screen sizes
