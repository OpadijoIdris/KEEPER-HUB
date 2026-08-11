-- AlterTable
ALTER TABLE "settings_agent_policies" ADD COLUMN     "destinationAllowlist" JSONB NOT NULL DEFAULT '[]';
