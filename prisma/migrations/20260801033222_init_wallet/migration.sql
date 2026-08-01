-- CreateTable
CREATE TABLE "wallet_agent_wallets" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "keeperHubIntegrationId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_agent_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_payment_authorizations" (
    "id" TEXT NOT NULL,
    "agentWalletId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_payment_authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallet_agent_wallets_agentId_key" ON "wallet_agent_wallets"("agentId");

-- CreateIndex
CREATE INDEX "wallet_payment_authorizations_agentId_idx" ON "wallet_payment_authorizations"("agentId");
