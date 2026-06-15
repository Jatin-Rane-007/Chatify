/**
 * One-shot cleanup: delete users that have no password.
 *
 * Why: signup/login now require a password (min 8 chars). Legacy passwordless
 * accounts (created before this change) can never log in again — and their
 * orphaned ChatRequests / ChatRooms / Messages would dangle. Run this once
 * after deploying the password requirement.
 *
 * Usage: tsx scripts/wipe-passwordless-accounts.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordless = await prisma.user.findMany({
    where: { password: null },
    select: { id: true, email: true },
  });

  if (passwordless.length === 0) {
    console.log('[wipe] no passwordless accounts found.');
    return;
  }

  console.log(`[wipe] deleting ${passwordless.length} passwordless account(s):`);
  for (const u of passwordless) console.log(`  - ${u.email} (${u.id})`);

  const ids = passwordless.map((u) => u.id);

  // Cascade by hand: MongoDB + Prisma doesn't always enforce onDelete in the way
  // SQL does — clear dependents explicitly before deleting users.
  const rooms = await prisma.chatRoom.findMany({
    where: { OR: [{ user1Id: { in: ids } }, { user2Id: { in: ids } }] },
    select: { id: true },
  });
  const roomIds = rooms.map((r) => r.id);

  await prisma.message.deleteMany({ where: { chatRoomId: { in: roomIds } } });
  await prisma.chatRoom.deleteMany({ where: { id: { in: roomIds } } });
  await prisma.chatRequest.deleteMany({
    where: { OR: [{ senderId: { in: ids } }, { receiverId: { in: ids } }] },
  });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });

  console.log('[wipe] done.');
}

main()
  .catch((err) => {
    console.error('[wipe] failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
