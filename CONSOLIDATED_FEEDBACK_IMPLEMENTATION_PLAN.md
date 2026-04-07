# Consolidated Feedback Implementation Plan

Date: 2026-03-25
Project: CSM (3 Office Deployments + Provincial Office Consolidation)

## 1. Problem Summary

Current situation:
- There are 3 offices collecting feedback.
- Each office is deployed locally and stores its own data.
- Provincial Office (PO) must review office submissions and export one final consolidated report.

Target outcome:
- PO can receive feedback data from all offices.
- PO can review/validate submissions before including them.
- Final export is generated from one consolidated dataset.

## 2. Recommended Architecture (Hub-and-Spoke)

Use PO as the central consolidation hub.

- Office instances (Spokes):
  - Continue collecting feedback locally.
  - Periodically create export packages for PO.
- PO instance (Hub):
  - Imports packages from each office.
  - Tracks review status (Pending, Approved, Rejected).
  - Exports only approved records as final consolidated report.

Why this fits local deployments:
- Offices can still work offline/local.
- No need for all offices to connect to a single always-online database.
- PO keeps governance and final control before export.

## 3. Data Model Additions

Add fields to `Feedback` (or create a consolidation table) so imported records can be tracked safely.

Required metadata:
- `sourceOfficeCode` (string): office identifier (PO, CCNTS, PTCDDS, etc.)
- `sourceDeploymentId` (string): unique ID of office installation
- `sourceRecordId` (string): original local record ID
- `sourceControlNumber` (string): original office control number
- `syncBatchId` (string): ID of the export package/batch
- `syncImportedAt` (datetime)
- `reviewStatus` (enum/string): `PENDING | APPROVED | REJECTED`
- `reviewedBy` (string, nullable)
- `reviewedAt` (datetime, nullable)
- `reviewNotes` (string, nullable)
- `consolidationKey` (string, unique): stable dedupe key

Recommended unique constraints:
- Unique on `consolidationKey`
- Optional unique on (`sourceDeploymentId`, `sourceRecordId`)

## 4. Data Exchange Format

Use signed JSON batch files first (simple and reliable).

Batch structure:
- `header`:
  - `batchId`
  - `officeCode`
  - `deploymentId`
  - `createdAt`
  - `recordCount`
  - `schemaVersion`
- `records`: array of feedback payloads + source metadata
- `integrity`:
  - `sha256` hash of payload

Optional improvement:
- Add HMAC signature per office shared key for tamper detection.

## 5. Workflow

Office side:
1. Staff submits feedback as usual.
2. Admin generates "Sync Package" for date range/month.
3. System marks records as `EXPORTED_TO_PO` with `syncBatchId`.
4. File is sent to PO (USB, LAN shared folder, secure email, etc.).

PO side:
1. PO uploads package in admin dashboard.
2. System validates schema, hash/signature, and duplicates.
3. Valid records are imported with `reviewStatus = PENDING`.
4. PO reviews each record (or bulk by office/date).
5. PO marks as `APPROVED` or `REJECTED` with notes.
6. Consolidated export includes only approved records.

## 6. Application Changes

### 6.1 Office App Changes

- Add office-level config:
  - `OFFICE_CODE`
  - `DEPLOYMENT_ID`
- Add endpoint: `POST /api/admin/sync/export`
  - Input: date range / month
  - Output: downloadable JSON batch
- Add status flag on exported records to prevent accidental re-export confusion.
- Add "Sync History" page:
  - batch ID, date, record count, export user

### 6.2 PO App Changes

- Add endpoint: `POST /api/admin/sync/import`
  - Accept JSON batch file
  - Validate schema + hash + duplicate checks
  - Upsert/import with `PENDING` status
- Add review endpoints:
  - `POST /api/admin/review/approve`
  - `POST /api/admin/review/reject`
- Add dashboard pages/tabs:
  - `Incoming Batches`
  - `Pending Review`
  - `Approved`
  - `Rejected`
- Update export endpoint:
  - Include `reviewStatus=APPROVED` filter
  - Optionally filter by office and month

## 7. Duplicate and Conflict Rules

Use deterministic merge rules:
- If same `consolidationKey` exists, skip as duplicate.
- If same source record but changed content:
  - Keep latest by `updatedAt` if available, or
  - Keep first import and flag conflict for manual review.
- Never silently overwrite approved records.

Suggested `consolidationKey` format:
- `sourceDeploymentId + ':' + sourceRecordId`
- Fallback: hash of key immutable fields if source IDs are unavailable.

## 8. Security and Audit

Minimum controls:
- Require PO admin authentication for import/review/export.
- Log every import/review/export action with timestamp and user.
- Store original raw batch file in archive folder for traceability.
- Restrict who can mark records as approved.

## 9. Rollout Plan (Phased)

Phase 1: Foundation
- Add schema fields and migration.
- Add office config (`OFFICE_CODE`, `DEPLOYMENT_ID`).
- Add batch JSON exporter in office app.

Phase 2: PO Consolidation
- Add importer with validation and dedupe.
- Add review status and review UI.
- Update export to approved-only records.

Phase 3: Hardening
- Add signature verification and stronger audit logs.
- Add conflict handling UI and reporting metrics.
- Add backup/restore process documentation.

Phase 4: Operations
- Train office admins on package generation schedule.
- Define official timeline (for example: weekly submission every Friday).
- Define PO SLA for review and final monthly export.

## 10. Acceptance Criteria

Implementation is complete when:
- PO can import packages from all 3 offices without duplicates.
- PO can approve/reject records before consolidation.
- Final export is generated from approved consolidated data only.
- Audit logs show who imported/reviewed/exported and when.
- Process works even when offices are offline from each other.

## 11. Suggested Initial Timeline

- Week 1: schema + office exporter
- Week 2: PO importer + dedupe
- Week 3: review UI + approved-only export
- Week 4: pilot with one office, then all three

## 12. Notes for This Codebase

Observed current stack:
- Local SQLite via Prisma in each deployment.
- Existing export endpoint already supports monthly/yearly filtering.
- Existing office field and control numbers can be reused as source metadata.

This plan avoids forcing direct live connectivity between offices and PO, while still enabling controlled consolidation and final reporting at PO level.
