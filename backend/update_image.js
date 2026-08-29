const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const dbUrlLine = env.split('\n').find(l => l.startsWith('DATABASE_URL='));
if (dbUrlLine) {
  process.env.DATABASE_URL = dbUrlLine.split('=')[1].trim().replace(/^"|"$/g, '');
}
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const product = await prisma.product.findFirst({
    where: { title: { contains: 'Fast Wireless Charger 15W' } }
  });
  
  if (product) {
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80', // Valid Unsplash image of a wireless charger
        isPrimary: true
      }
    });
    console.log('Successfully added image to Fast Wireless Charger 15W');
  } else {
    console.log('Product not found.');
  }
}

run().finally(() => prisma.$disconnect());
