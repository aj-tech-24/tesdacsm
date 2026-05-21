import { NextRequest, NextResponse } from "next/server";
import { listAchievements } from "@/lib/turso-achievements";
import { createRateLimitResponse, enforceRateLimit } from "@/lib/request-protection";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const burstLimit = await enforceRateLimit(req, {
      scope: "achievements:burst",
      limit: 60,
      windowMs: 60 * 1000,
    })

    if (!burstLimit.allowed) {
      return createRateLimitResponse(burstLimit)
    }

    const sustainedLimit = await enforceRateLimit(req, {
      scope: "achievements:sustained",
      limit: 600,
      windowMs: 15 * 60 * 1000,
    })

    if (!sustainedLimit.allowed) {
      return createRateLimitResponse(sustainedLimit)
    }

    const items = await listAchievements({ activeOnly: true });
    console.log('PUBLIC GET returning achievements count=', items.length, ' first icons=', items.slice(0,5).map(i=>i.iconName));

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error("Public achievements GET failed:", error);
    return NextResponse.json({ success: false, items: [] }, { status: 500 });
  }
}
