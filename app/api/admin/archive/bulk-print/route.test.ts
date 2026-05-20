import test from "node:test";
import assert from "node:assert/strict";
import { handleBulkPrint } from "./route";

test("authenticated bulk-print returns a PDF response using the CSM template", async () => {
  const pdfBuffer = Buffer.from("%PDF-1.4 fake pdf");
  let receivedHtml = "";

  const response = await handleBulkPrint(
    new Request("http://localhost/api/admin/archive/bulk-print", {
      method: "POST",
      body: JSON.stringify({ monthKey: "2026-05", format: "pdf" }),
    }),
    {
      getSessionFn: async () => ({ role: "super_admin", office: "" }) as any,
      getClientFn: () => ({
        execute: async () => ({
          rows: [
            {
              id: 1,
              controlNumber: "CN-001",
              name: "Jane Doe",
              office: "MAIN OFFICE",
              citizensCharterService: "Service A",
              formDate: "2026-05-12",
              cc1: "1",
              cc2: "2",
              cc3: "3",
              suggestions: "Keep it up",
              sqd0: "5",
              sqd1: "5",
              sqd2: "5",
              sqd3: "5",
              sqd4: "5",
              sqd5: "5",
              sqd6: "5",
              sqd7: "5",
              sqd8: "5",
            },
          ],
        }),
      }) as any,
      browserLauncher: async () => ({
        newPage: async () => ({
          setContent: async (html: string) => {
            receivedHtml = html;
          },
          pdf: async () => pdfBuffer,
        }),
        close: async () => undefined,
      }) as any,
    }
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/pdf");
  assert.match(response.headers.get("content-disposition") || "", /feedbacks-2026-05\.pdf/);

  const output = Buffer.from(await response.arrayBuffer());
  assert.equal(output.toString(), pdfBuffer.toString());
  assert.match(receivedHtml, /HELP US SERVE YOU BETTER!/);
  assert.match(receivedHtml, /CN-001/);
  assert.match(receivedHtml, /Jane Doe/);
  assert.match(receivedHtml, /Service A/);
});

test("unauthenticated bulk-print returns 401", async () => {
  const response = await handleBulkPrint(
    new Request("http://localhost/api/admin/archive/bulk-print", {
      method: "POST",
      body: JSON.stringify({ monthKey: "2026-05", format: "pdf" }),
    }),
    {
      getSessionFn: async () => null,
    }
  );

  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "Not authorized");
});

test("bulk-print rejects non-pdf format", async () => {
  const response = await handleBulkPrint(
    new Request("http://localhost/api/admin/archive/bulk-print", {
      method: "POST",
      body: JSON.stringify({ monthKey: "2026-05", format: "html" }),
    }),
    {
      getSessionFn: async () => ({ role: "super_admin", office: "" }) as any,
    }
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "Invalid format (expected 'pdf')");
});

test("bulk-print returns 500 when PDF generation fails", async () => {
  const response = await handleBulkPrint(
    new Request("http://localhost/api/admin/archive/bulk-print", {
      method: "POST",
      body: JSON.stringify({ monthKey: "2026-05" }),
    }),
    {
      getSessionFn: async () => ({ role: "super_admin", office: "" }) as any,
      getClientFn: () => ({
        execute: async () => ({
          rows: [
            {
              id: 1,
              controlNumber: "CN-001",
              name: "Jane Doe",
              office: "MAIN OFFICE",
              citizensCharterService: "Service A",
              formDate: "2026-05-12",
              cc1: "1",
              cc2: "2",
              cc3: "3",
              suggestions: "Keep it up",
              sqd0: "5",
              sqd1: "5",
              sqd2: "5",
              sqd3: "5",
              sqd4: "5",
              sqd5: "5",
              sqd6: "5",
              sqd7: "5",
              sqd8: "5",
            },
          ],
        }),
      }) as any,
      browserLauncher: async () => {
        throw new Error("Chromium launch failed");
      },
    }
  );

  assert.equal(response.status, 500);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "Failed to generate PDF for this batch");
});
