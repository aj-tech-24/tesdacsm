import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type NotificationRow = {
    id: number;
    createdAt: string | Date;
    readAt: string | Date | null;
    level: string;
    title: string;
    message: string;
    controlNumber: string;
    office: string | null;
    service: string | null;
    lowestRating: number | null;
    feedbackId: number;
    clientName: string | null;
};

const officeMatches = (office: string | null | undefined, key: "PO" | "CCNTS" | "PTC") => {
    const value = (office || "").toUpperCase();
    if (!value) return false;
    if (key === "CCNTS") return value.includes("CCNTS");
    if (key === "PTC") return value.includes("PTC") || value.includes("PTCDDS");
    return (
        value.includes("PO") ||
        value.includes("PROVIN") ||
        value.includes("TESDA PO DS")
    ) && !value.includes("PTC") && !value.includes("CCNTS");
};

const getOfficeKey = (session: { role: string; office: string }) => {
    if (session.role !== "office_admin") {
        return null;
    }

    if (session.office === "CCNTS") return "CCNTS";
    if (session.office === "PTC") return "PTC";
    return "PO";
};

const filterNotifications = (notifications: NotificationRow[], officeKey: "PO" | "CCNTS" | "PTC" | null) => {
    if (!officeKey) return notifications;
    return notifications.filter((notification) => officeMatches(notification.office, officeKey));
};

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const officeKey = getOfficeKey(session);
        let notifications: NotificationRow[] = [];
        
        try {
            notifications = await prisma.$queryRawUnsafe<NotificationRow[]>(
                `SELECT n.id, n.createdAt, n.readAt, n.level, n.title, n.message, n.controlNumber, n.office, n.service, n.lowestRating, n.feedbackId, f.name as clientName FROM "Notification" n LEFT JOIN "Feedback" f ON n.feedbackId = f.id ORDER BY n.createdAt DESC LIMIT 20`
            );
        } catch (queryError) {
            // Notification table may not exist yet, continue with empty list
            console.error("Failed to load notifications:", queryError);
            notifications = [];
        }

        const filteredNotifications = filterNotifications(notifications, officeKey);
        const unreadCount = filteredNotifications.filter((notification) => !notification.readAt).length;

        return NextResponse.json({
            success: true,
            notifications: filteredNotifications,
            unreadCount,
        });
    } catch (error) {
        console.error("Failed to load notifications:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const body = await req.json();
        const numericId = Number.parseInt(String(body?.id ?? ""), 10);
        const markAllRead = Boolean(body?.markAllRead);
        const resolve = Boolean(body?.resolve);
        const officeKey = getOfficeKey(session);

        if (markAllRead) {
            try {
                const notifications = await prisma.$queryRawUnsafe<Pick<NotificationRow, "id" | "office">[]>(
                    `SELECT id, office FROM "Notification" ORDER BY createdAt DESC LIMIT 20`
                );
                const eligibleIds = filterNotifications(notifications as NotificationRow[], officeKey).map((notification) => notification.id);

                if (eligibleIds.length > 0) {
                    await prisma.$executeRawUnsafe(
                        `UPDATE "Notification" SET "readAt" = ? WHERE "id" IN (${eligibleIds.map(() => "?").join(", ")})`,
                        new Date(),
                        ...eligibleIds,
                    );
                }
            } catch (updateError) {
                console.error("Failed to mark notifications as read:", updateError);
                // Continue even if update fails
            }

            return NextResponse.json({ success: true });
        }

        if (Number.isNaN(numericId)) {
            return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
        }

        try {
            const notification = await prisma.$queryRawUnsafe<Array<Pick<NotificationRow, "id" | "office">>>(
                `SELECT id, office FROM "Notification" WHERE id = ? LIMIT 1`,
                numericId
            );

            if (notification.length === 0 || (officeKey && !officeMatches(notification[0].office, officeKey))) {
                return NextResponse.json({ error: "Notification not found" }, { status: 404 });
            }

            if (resolve) {
                // Delete the notification
                await prisma.$executeRawUnsafe(
                    `DELETE FROM "Notification" WHERE "id" = ?`,
                    numericId,
                );
            } else {
                // Mark as read
                await prisma.$executeRawUnsafe(
                    `UPDATE "Notification" SET "readAt" = ? WHERE "id" = ?`,
                    new Date(),
                    numericId,
                );
            }
        } catch (updateError) {
            console.error("Failed to update notification:", updateError);
            // Continue even if update fails
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update notifications:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
