-- AlterTable
ALTER TABLE "wallet_payment_authorizations" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'unknown';
