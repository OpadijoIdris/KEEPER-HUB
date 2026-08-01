-- CreateTable
CREATE TABLE "audit_logs_entries" (
    "id" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "eventType" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_entries_correlationId_idx" ON "audit_logs_entries"("correlationId");

-- CreateIndex
CREATE INDEX "audit_logs_entries_subjectId_idx" ON "audit_logs_entries"("subjectId");

-- CreateIndex
CREATE INDEX "audit_logs_entries_eventType_idx" ON "audit_logs_entries"("eventType");

-- CreateIndex
CREATE INDEX "audit_logs_entries_occurredAt_idx" ON "audit_logs_entries"("occurredAt");
