-- CreateTable
CREATE TABLE "Leader" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "photo" TEXT,
    "tagline" TEXT,
    "profile" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "bio" TEXT,
    "responsibilities" TEXT[],
    "achievements" TEXT[],
    "education" TEXT[],
    "leadershipSkills" TEXT[],
    "professionalBackground" TEXT,
    "sportingJourney" TEXT,
    "term" TEXT,
    "socials" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Leader_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Leader_slug_key" ON "Leader"("slug");

-- CreateIndex
CREATE INDEX "Leader_slug_idx" ON "Leader"("slug");

-- CreateIndex
CREATE INDEX "Leader_name_idx" ON "Leader"("name");

-- CreateIndex
CREATE INDEX "Leader_title_idx" ON "Leader"("title");
