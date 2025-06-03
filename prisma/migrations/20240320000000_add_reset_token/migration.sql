-- Add reset token fields to Parent table
ALTER TABLE "Parent" ADD COLUMN "resetToken" TEXT UNIQUE;
ALTER TABLE "Parent" ADD COLUMN "resetTokenExpiry" TIMESTAMP(3); 