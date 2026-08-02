-- CreateTable
CREATE TABLE "keeperhub_executions" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "keeperHubExecutionId" TEXT,
    "transactionHash" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keeperhub_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "keeperhub_executions_agentId_idx" ON "keeperhub_executions"("agentId");
