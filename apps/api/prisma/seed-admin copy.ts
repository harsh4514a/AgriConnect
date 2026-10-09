import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const rawUsername = process.env.ADMIN_USERNAME;
  const rawPassword = process.env.ADMIN_PASSWORD;

  if (!rawUsername) {
    throw new Error(
      'ADMIN_USERNAME is required. Set it in the API environment before running the admin seed.',
    );
  }

  if (!rawPassword) {
    throw new Error(
      'ADMIN_PASSWORD is required. Set it in the API environment before running the admin seed.',
    );
  }

  const username = rawUsername.trim().toLowerCase();

  if (!/^[a-zA-Z0-9._-]{3,50}$/.test(username)) {
    throw new Error(
      'ADMIN_USERNAME must contain 3-50 letters, numbers, dots, underscores, or hyphens.',
    );
  }

  if (rawPassword.length < 12 || rawPassword.length > 128) {
    throw new Error('ADMIN_PASSWORD must be between 12 and 128 characters long.');
  }

  const passwordHash = await bcrypt.hash(rawPassword, 12);

  await prisma.admin.upsert({
    where: { username },
    update: {
      passwordHash,
      isActive: true,
      updatedAt: new Date(),
    },
    create: {
      username,
      passwordHash,
      isActive: true,
    },
  });

  console.log('[Admin Seed] Admin account provisioned successfully.');
  console.log(`[Admin Seed] Username: ${username}`);
  console.log('[Admin Seed] Password was supplied through ADMIN_PASSWORD.');
}

main()
  .catch((error: unknown) => {
    const errorType = error instanceof Error ? error.name : 'UnknownError';
    console.error(`[Admin Seed] Provisioning failed (${errorType}).`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
