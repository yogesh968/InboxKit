import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking database tiles...');
  const count = await prisma.tile.count();
  
  if (count === 2500) {
    console.log('Database already has 2500 tiles. Seeding skipped.');
    return;
  }
  
  console.log(`Found ${count} tiles. Resetting and seeding 2500 tiles...`);
  
  const tilesData = [];
  for (let y = 0; y < 50; y++) {
    for (let x = 0; x < 50; x++) {
      const id = x + y * 50;
      tilesData.push({
        id,
        x,
        y,
        userId: null,
      });
    }
  }

  // Delete any existing tiles to ensure clean state
  await prisma.tile.deleteMany({});
  
  // Use createMany for high performance batch insertion in PostgreSQL
  await prisma.tile.createMany({
    data: tilesData,
  });

  console.log('Seeded 2500 tiles successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
