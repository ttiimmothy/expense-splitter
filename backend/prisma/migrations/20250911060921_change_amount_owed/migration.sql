/*
  Warnings:

  - You are about to drop the column `amountPaid` on the `expense_shares` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."expense_shares" DROP COLUMN "amountPaid",
ADD COLUMN     "amountOwed" DECIMAL(12,2) NOT NULL DEFAULT 0;
