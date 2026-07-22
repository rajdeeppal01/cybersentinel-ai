import { prisma } from './src/db';

async function main() {
  const threats = await prisma.threatLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("=== LATEST 5 THREATS IN DB ===");
  console.log(JSON.stringify(threats, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
