-- CreateTable
CREATE TABLE "settings_agent_policies" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "spendLimit" TEXT NOT NULL DEFAULT '0',
    "allowedActions" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_agent_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings_agent_policies_agentId_key" ON "settings_agent_policies"("agentId");
