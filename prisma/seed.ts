import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  // Create 2 users
  for (let i = 0; i < 2; i++) {
    const user = await prisma.user.create({
      data: {
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        passwordHash: faker.internet.password(),
      },
    });

    // Create 1 budgets for each user
    await prisma.budget.create({
      data: {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        userId: user.id,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
