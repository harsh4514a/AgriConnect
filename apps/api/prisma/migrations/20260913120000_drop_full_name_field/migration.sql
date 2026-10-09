-- AlterTable: Drop the fullName column now that firstName and lastName are established.
-- Data was already migrated in migration 20260903120000_split_user_name_into_first_and_last_name.
ALTER TABLE "users" DROP COLUMN IF EXISTS "fullName";
