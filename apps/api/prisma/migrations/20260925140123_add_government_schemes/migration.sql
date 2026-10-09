-- CreateTable
CREATE TABLE "government_schemes" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "governmentLevel" VARCHAR(20) NOT NULL,
    "department" VARCHAR(200) NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "availableStates" TEXT[] DEFAULT ARRAY['Gujarat']::TEXT[],
    "applicationUrl" VARCHAR(500),
    "sourceUrl" VARCHAR(500) NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "government_schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "government_scheme_contents" (
    "id" UUID NOT NULL,
    "schemeId" UUID NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "shortDescription" VARCHAR(500) NOT NULL,
    "description" TEXT NOT NULL,
    "benefits" JSONB NOT NULL,
    "eligibility" JSONB NOT NULL,
    "documents" JSONB NOT NULL,
    "applicationSteps" JSONB NOT NULL,
    "conditions" JSONB NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "searchText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "government_scheme_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "government_schemes_slug_key" ON "government_schemes"("slug");

-- CreateIndex
CREATE INDEX "government_schemes_governmentLevel_status_isPublished_sortO_idx" ON "government_schemes"("governmentLevel", "status", "isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "government_schemes_category_isPublished_sortOrder_idx" ON "government_schemes"("category", "isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "government_scheme_contents_locale_schemeId_idx" ON "government_scheme_contents"("locale", "schemeId");

-- CreateIndex
CREATE INDEX "government_scheme_contents_schemeId_locale_idx" ON "government_scheme_contents"("schemeId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "government_scheme_contents_schemeId_locale_key" ON "government_scheme_contents"("schemeId", "locale");

-- AddForeignKey
ALTER TABLE "government_scheme_contents" ADD CONSTRAINT "government_scheme_contents_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "government_schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
