import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const categories = Array.from({ length: 2 }, () => ({
  name: faker.commerce.department(),
  emoji: faker.internet.emoji(),
  limitAmount: parseFloat(faker.finance.amount({ max: 500 })),
}));

const users = Array.from({ length: 2 }, () => ({
  username: faker.person.fullName(),
  email: faker.internet.email(),
  passwordHash: faker.internet.password(),
  categories: {
    create: categories,
  },
}));

async function main() {
  users.forEach(async (user) => {
    await prisma.user.create({
      data: user,
    });
  });
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
