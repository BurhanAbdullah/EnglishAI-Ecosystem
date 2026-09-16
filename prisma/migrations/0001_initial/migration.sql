CREATE TYPE "UserRole" AS ENUM ('LEARNER', 'ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING');
CREATE TYPE "JoinRole" AS ENUM ('RESEARCHER', 'EDUCATOR', 'ENGINEER', 'CONTRIBUTOR');
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT,
  "name" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'LEARNER',
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastLoginAt" TIMESTAMP(3),
  "emailVerifiedAt" TIMESTAMP(3),
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "LearnerProfile" (
  "userId" TEXT NOT NULL,
  "level" TEXT,
  "goals" TEXT,
  "targetSkills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "usageQuota" INTEGER NOT NULL DEFAULT 100,
  "usageThisPeriod" INTEGER NOT NULL DEFAULT 0,
  "periodResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LearnerProfile_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "LearnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "UsagePolicy" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "dailyMessageLimit" INTEGER NOT NULL DEFAULT 100,
  "monthlyMessageLimit" INTEGER NOT NULL DEFAULT 2000,
  "allowedAgents" TEXT[] NOT NULL DEFAULT ARRAY['grammar','vocabulary','reading','writing','assessment','citation']::TEXT[],
  "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UsagePolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UsageEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "agentUsed" TEXT NOT NULL,
  "tokensOrCallsConsumed" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "UsageEvent_userId_createdAt_idx" ON "UsageEvent"("userId", "createdAt");
CREATE INDEX "UsageEvent_agentUsed_createdAt_idx" ON "UsageEvent"("agentUsed", "createdAt");

CREATE TABLE "JoinApplication" (
  "id" TEXT NOT NULL,
  "applicantName" TEXT NOT NULL,
  "applicantEmail" TEXT NOT NULL,
  "role" "JoinRole" NOT NULL,
  "motivation" TEXT NOT NULL,
  "cvDriveUrl" TEXT NOT NULL,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedByAdminId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JoinApplication_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "JoinApplication_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "JoinApplication_status_createdAt_idx" ON "JoinApplication"("status", "createdAt");
CREATE INDEX "JoinApplication_applicantEmail_createdAt_idx" ON "JoinApplication"("applicantEmail", "createdAt");

CREATE TABLE "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "AdminAuditLog_adminId_createdAt_idx" ON "AdminAuditLog"("adminId", "createdAt");
CREATE INDEX "AdminAuditLog_targetType_targetId_createdAt_idx" ON "AdminAuditLog"("targetType", "targetId", "createdAt");

INSERT INTO "UsagePolicy" ("id", "updatedAt") VALUES (1, CURRENT_TIMESTAMP);
