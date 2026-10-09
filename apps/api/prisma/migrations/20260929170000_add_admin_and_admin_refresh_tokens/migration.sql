-- CreateTable
CREATE TABLE "admins" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_refresh_tokens" (
    "id" UUID NOT NULL,
    "adminId" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE INDEX "admins_username_idx" ON "admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "admin_refresh_tokens_token_key" ON "admin_refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "admin_refresh_tokens_adminId_idx" ON "admin_refresh_tokens"("adminId");

-- CreateIndex
CREATE INDEX "admin_refresh_tokens_token_idx" ON "admin_refresh_tokens"("token");

-- AddForeignKey
ALTER TABLE "admin_refresh_tokens" ADD CONSTRAINT "admin_refresh_tokens_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
