-- Add admin-selected nature of transaction on feedback records.
ALTER TABLE "Feedback" ADD COLUMN "natureOfTransaction" TEXT;
