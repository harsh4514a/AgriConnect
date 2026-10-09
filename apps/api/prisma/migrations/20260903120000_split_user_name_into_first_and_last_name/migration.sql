-- AlterTable: Add firstName and lastName columns to users table
ALTER TABLE "users" ADD COLUMN "firstName" VARCHAR(50);
ALTER TABLE "users" ADD COLUMN "lastName" VARCHAR(50);

-- Data migration: Split existing fullName into firstName and lastName
UPDATE "users"
SET 
  "firstName" = TRIM(SPLIT_PART("fullName", ' ', 1)),
  "lastName" = CASE 
    WHEN "fullName" IS NULL OR "fullName" = '' THEN NULL
    WHEN POSITION(' ' IN "fullName") = 0 THEN ''
    ELSE TRIM(SUBSTR("fullName", POSITION(' ' IN "fullName") + 1))
  END
WHERE "fullName" IS NOT NULL AND "fullName" != '';

-- For users with NULL fullName, both firstName and lastName will remain NULL
