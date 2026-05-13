-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME,
    "level" TEXT NOT NULL DEFAULT 'warning',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "controlNumber" TEXT NOT NULL,
    "office" TEXT,
    "service" TEXT,
    "lowestRating" INTEGER,
    "feedbackId" INTEGER NOT NULL,
    CONSTRAINT "Notification_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_feedbackId_key" ON "Notification"("feedbackId");
