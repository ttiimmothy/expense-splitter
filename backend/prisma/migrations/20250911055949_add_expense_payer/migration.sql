-- AlterTable
ALTER TABLE "public"."expenses" ADD COLUMN     "payerId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
