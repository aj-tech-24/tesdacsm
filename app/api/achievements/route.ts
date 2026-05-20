import { NextResponse } from "next/server";
import { listAchievements } from "@/lib/turso-achievements";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await listAchievements({ activeOnly: true });
    console.log('PUBLIC GET returning achievements count=', items.length, ' first icons=', items.slice(0,5).map(i=>i.iconName));

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error("Public achievements GET failed:", error);
    return NextResponse.json({ success: false, items: [] }, { status: 500 });
  }
}
