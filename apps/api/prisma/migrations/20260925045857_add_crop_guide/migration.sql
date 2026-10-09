-- CreateTable
CREATE TABLE "crop_guides" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "image" VARCHAR(300) NOT NULL,
    "imageAlt" VARCHAR(200) NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sourceName" VARCHAR(200) NOT NULL,
    "sourceUrl" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crop_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop_guide_contents" (
    "id" UUID NOT NULL,
    "cropGuideId" UUID NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "searchText" VARCHAR(500) NOT NULL,
    "shortDescription" VARCHAR(300) NOT NULL,
    "suitableSeason" VARCHAR(200),
    "sections" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crop_guide_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crop_guides_slug_key" ON "crop_guides"("slug");

-- CreateIndex
CREATE INDEX "crop_guides_category_isPublished_sortOrder_idx" ON "crop_guides"("category", "isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "crop_guide_contents_locale_searchText_idx" ON "crop_guide_contents"("locale", "searchText");

-- CreateIndex
CREATE INDEX "crop_guide_contents_cropGuideId_locale_idx" ON "crop_guide_contents"("cropGuideId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "crop_guide_contents_cropGuideId_locale_key" ON "crop_guide_contents"("cropGuideId", "locale");

-- AddForeignKey
ALTER TABLE "crop_guide_contents" ADD CONSTRAINT "crop_guide_contents_cropGuideId_fkey" FOREIGN KEY ("cropGuideId") REFERENCES "crop_guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;
