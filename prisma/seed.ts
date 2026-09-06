import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('TaskVader@123', 10);

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@lolc.com' },
    update: {},
    create: {
      name: 'Operations Supervisor',
      email: 'supervisor@lolc.com',
      passwordHash,
      role: Role.SUPERVISOR,
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff@lolc.com' },
    update: {},
    create: {
      name: 'Staff Member',
      email: 'staff@lolc.com',
      passwordHash,
      role: Role.STAFF,
      supervisorId: supervisor.id,
    },
  });

  await prisma.holiday.createMany({
    data: [
      { date: new Date('2026-01-01'), name: 'New Year Holiday', type: 'PUBLIC' },
      { date: new Date('2026-09-26'), name: 'Binara Full Moon Poya Day', type: 'POYA' },
      { date: new Date('2026-10-25'), name: 'Vap Full Moon Poya Day', type: 'POYA' },
    ],
    skipDuplicates: true,
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
