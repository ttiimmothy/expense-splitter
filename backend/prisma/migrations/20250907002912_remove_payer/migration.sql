/*
  Warnings:

  - You are about to drop the column `amountOwed` on the `expense_shares` table. All the data in the column will be lost.
  - You are about to drop the column `payerId` on the `expenses` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."expenses" DROP CONSTRAINT "expenses_payerId_fkey";

-- AlterTable
ALTER TABLE "public"."expense_shares" DROP COLUMN "amountOwed",
ADD COLUMN     "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."expenses" DROP COLUMN "payerId";
