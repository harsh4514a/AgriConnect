import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const rawUsername = process.env.ADMIN_USERNAME;
  const rawPassword = process.env.ADMIN_PASSWORD;

  if (!rawUsername) {
    throw new Error('ADMIN_USERNAME is required to provision the administrator.');
  }
  if (!rawPassword) {
    throw new Error('ADMIN_PASSWORD is required to provision the administrator.');
  }

  const username = rawUsername.trim().toLowerCase();

  if (!/^[a-z0-9._-]{3,50}$/.test(username)) {
    throw new Error('ADMIN_USERNAME must contain 3-50 letters, numbers, dots, underscores, or hyphens.');
  }

  if (rawPassword.length < 12 || rawPassword.length > 128) {
    throw new Error('ADMIN_PASSWORD must be between 12 and 128 characters long.');
  }

  console.log(`[Admin Seed] Provisioning admin account: "${username}"...`);

  const passwordHash = await bcrypt.hash(rawPassword, 12);

  const admin = await prisma.admin.upsert({
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
    select: {
      id: true,
      username: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  console.log(`[Admin Seed] Admin account provisioned successfully!`);
  console.log(`[Admin Seed] ID: ${admin.id}`);
  console.log(`[Admin Seed] Username: ${admin.username}`);
  console.log(`[Admin Seed] Status: ${admin.isActive ? 'Active' : 'Disabled'}`);
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
