-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "office" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'office_admin',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Feedback" (
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
    "dateResolved" TEXT
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReportMetadata" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reportPeriod" TEXT NOT NULL DEFAULT '',
    "regionExecutive" TEXT,
    "provinceDistrict" TEXT,
    "operatingUnit" TEXT,
    "headOfUnit" TEXT,
    "designation" TEXT,
    "cusatFocal" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
