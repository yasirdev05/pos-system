import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.category.create({ data: { name: 'Test' } });
  console.log('Success');
}
main().catch(console.error).finally(() => prisma.$disconnect());
