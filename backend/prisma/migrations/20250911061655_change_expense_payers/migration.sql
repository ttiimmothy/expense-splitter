/*
  Warnings:

  - You are about to drop the column `payerId` on the `expenses` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."expenses" DROP CONSTRAINT "expenses_payerId_fkey";

-- AlterTable
ALTER TABLE "public"."expenses" DROP COLUMN "payerId";

-- CreateTable
CREATE TABLE "public"."expense_payers" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "expense_payers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expense_payers_expenseId_userId_key" ON "public"."expense_payers"("expenseId", "userId");

-- AddForeignKey
ALTER TABLE "public"."expense_payers" ADD CONSTRAINT "expense_payers_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "public"."expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_payers" ADD CONSTRAINT "expense_payers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
