-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Feedback" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "controlNumber" TEXT NOT NULL,
    "name" TEXT,
    "clientType" TEXT,
    "age" TEXT,
    "sex" TEXT,
    "formDate" TEXT,
    "email" TEXT,
    "employeeName" TEXT,
    "regionOfResidence" TEXT,
    "province" TEXT,
    "municipality" TEXT,
    "office" TEXT,
    "citizensCharterService" TEXT,
    "serviceCategory" TEXT,
    "transactionTypes" TEXT,
    "cc1" TEXT,
    "cc2" TEXT,
    "cc3" TEXT,
    "sqd0" TEXT,
    "sqd1" TEXT,
    "sqd2" TEXT,
    "sqd3" TEXT,
    "sqd4" TEXT,
    "sqd5" TEXT,
    "sqd6" TEXT,
    "sqd7" TEXT,
    "sqd8" TEXT,
    "suggestions" TEXT,
    "actionProvided" TEXT,
    "dateResolved" TEXT,
    "natureOfTransaction" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Feedback" ("actionProvided", "age", "cc1", "cc2", "cc3", "citizensCharterService", "clientType", "controlNumber", "createdAt", "dateResolved", "email", "employeeName", "formDate", "id", "municipality", "name", "natureOfTransaction", "office", "province", "regionOfResidence", "serviceCategory", "sex", "sqd0", "sqd1", "sqd2", "sqd3", "sqd4", "sqd5", "sqd6", "sqd7", "sqd8", "suggestions", "transactionTypes") SELECT "actionProvided", "age", "cc1", "cc2", "cc3", "citizensCharterService", "clientType", "controlNumber", "createdAt", "dateResolved", "email", "employeeName", "formDate", "id", "municipality", "name", "natureOfTransaction", "office", "province", "regionOfResidence", "serviceCategory", "sex", "sqd0", "sqd1", "sqd2", "sqd3", "sqd4", "sqd5", "sqd6", "sqd7", "sqd8", "suggestions", "transactionTypes" FROM "Feedback";
DROP TABLE "Feedback";
ALTER TABLE "new_Feedback" RENAME TO "Feedback";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
