-- CreateTable
CREATE TABLE "settings_user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationPreferences" JSONB NOT NULL DEFAULT '[]',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings_platform_settings" (
    "id" TEXT NOT NULL,
    "featureFlags" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings_user_preferences_userId_key" ON "settings_user_preferences"("userId");
