// prisma/seed.ts

const { PrismaClient } = require('@prisma/client');

// initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  // create two dummy articles
  const baseUser = await prisma.user.upsert({
    where: { name: 'panda' },
    update: {
      password: {
        set: '$2a$10$3SyB/x0LUs8qzbEJapjsTeNhBVs9GqqKKAsNxVJyX44wpqGCNE1eu',
      },
    },
    create: {
      name: 'panda',
      role: 'ADMIN',
      password: '$2a$10$3SyB/x0LUs8qzbEJapjsTeNhBVs9GqqKKAsNxVJyX44wpqGCNE1eu',
      email: 'panda@qq.com',
      status: 'ACTIVITY',
      person: {
        create: {
          code: '10001',
          name: '王者',
        },
      },
    },
  });

  console.log({ baseUser });
}

// execute the main function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect();
  });
