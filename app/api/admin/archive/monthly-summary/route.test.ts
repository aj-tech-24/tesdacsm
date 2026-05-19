import test from "node:test";
import assert from "node:assert/strict";
import { handleMonthlySummary } from "./route";

const rows = [
  {
    id: 1,
    formDate: "2026-05-12",
    office: "MAIN OFFICE",
    isArchived: false,
    cc1: "1",
    cc2: null,
    cc3: null,
    suggestions: null,
    sqd0: null,
    sqd1: null,
    sqd2: null,
    sqd3: null,
    sqd4: null,
    sqd5: null,
    sqd6: null,
    sqd7: null,
    sqd8: null,
  },
  {
    id: 2,
    formDate: "2026-05-20",
    office: "MAIN OFFICE",
    isArchived: true,
    cc1: null,
    cc2: null,
    cc3: null,
    suggestions: "More seating",
    sqd0: null,
    sqd1: null,
    sqd2: null,
    sqd3: null,
    sqd4: null,
    sqd5: null,
    sqd6: null,
    sqd7: null,
    sqd8: null,
  },
  {
    id: 3,
    formDate: "2026-04-05",
    office: "REGIONAL OFFICE",
    isArchived: false,
    cc1: null,
    cc2: null,
    cc3: null,
    suggestions: null,
    sqd0: null,
    sqd1: null,
    sqd2: null,
    sqd3: null,
    sqd4: null,
    sqd5: null,
    sqd6: null,
    sqd7: null,
    sqd8: null,
  },
];

test("authenticated monthly-summary returns paginated, searchable archive data", async () => {
  let queryCount = 0;
  const cache = new Map<string, { ts: number; rows: typeof rows }>();

  const response = await handleMonthlySummary(
    new Request("http://localhost/api/admin/archive/monthly-summary?year=all&page=1&pageSize=1&q=main", {
      method: "GET",
    }),
    {
      getSessionFn: async () => ({ role: "super_admin", office: "" }) as any,
      getClientFn: () => ({
        execute: async () => {
          queryCount += 1;
          return { rows };
        },
      }) as any,
      cache,
    }
  );

  assert.equal(response.status, 200);
  const payload = await response.json();

  assert.equal(payload.success, true);
  assert.equal(payload.total, 1);
  assert.equal(payload.page, 1);
  assert.equal(payload.pageSize, 1);
  assert.equal(payload.data.length, 1);
  assert.equal(payload.data[0].month, "2026-05");
  assert.equal(payload.data[0].monthName, "May");
  assert.equal(payload.data[0].total, 2);
  assert.equal(payload.data[0].answered, 2);
  assert.equal(payload.data[0].pending, 0);
  assert.equal(payload.data[0].archived, 1);
  assert.equal(queryCount, 1);
});

test("office_admin monthly-summary filters by office and respects cache", async () => {
  let queryCount = 0;
  const cache = new Map<string, { ts: number; rows: typeof rows }>();

  const request = new Request("http://localhost/api/admin/archive/monthly-summary?year=all&page=1&pageSize=10", {
    method: "GET",
  });

  const first = await handleMonthlySummary(request, {
    getSessionFn: async () => ({ role: "office_admin", office: "main" }) as any,
    getClientFn: () => ({
      execute: async () => {
        queryCount += 1;
        return { rows };
      },
    }) as any,
    cache,
  });

  const second = await handleMonthlySummary(request, {
    getSessionFn: async () => ({ role: "office_admin", office: "main" }) as any,
    getClientFn: () => ({
      execute: async () => {
        queryCount += 1;
        return { rows };
      },
    }) as any,
    cache,
  });

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  const payload = await first.json();
  assert.equal(payload.success, true);
  assert.equal(payload.total, 1);
  assert.equal(payload.data.length, 1);
  assert.equal(payload.data[0].month, "2026-05");
  assert.equal(queryCount, 1);
});

test("unauthenticated monthly-summary returns 401", async () => {
  const response = await handleMonthlySummary(
    new Request("http://localhost/api/admin/archive/monthly-summary", { method: "GET" }),
    {
      getSessionFn: async () => null,
    }
  );

  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.error, "Not authorized");
});
