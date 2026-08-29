const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

const DATABASE_URL = "postgresql://neondb_owner:npg_iEOCnaZoz2U3@ep-royal-salad-aypa6g3h-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(DATABASE_URL);

async function run() {
  console.log('Seeding student marketplace categories and listings...');
  try {
    // 1. Create categories
    const categories = [
      { id: 'cat-books', name: 'Used Books', slug: 'used-books' },
      { id: 'cat-hostel', name: 'Hostel Essentials', slug: 'hostel-essentials' },
      { id: 'cat-lab', name: 'Lab Equipment', slug: 'lab-equipment' },
      { id: 'cat-cycles', name: 'Bicycles & Rides', slug: 'bicycles-rides' }
    ];

    for (const cat of categories) {
      await sql`
        INSERT INTO "Category" ("id", "name", "slug", "createdAt", "updatedAt")
        VALUES (${cat.id}, ${cat.name}, ${cat.slug}, NOW(), NOW())
        ON CONFLICT ("slug") DO UPDATE SET "name" = ${cat.name};
      `;
      console.log(`✅ Category "${cat.name}" verified`);
    }

    // 2. Fetch alpha seller profile or first seller profile to put sample items under
    const sellers = await sql`SELECT "id" FROM "SellerProfile" LIMIT 1;`;
    if (sellers.length > 0) {
      const sellerId = sellers[0].id;
      
      const sampleProducts = [
        {
          id: 'prod-book-1',
          sellerId,
          categoryId: 'cat-books',
          title: 'Introduction to Algorithms (CLRS) - 3rd Edition',
          slug: 'clrs-algorithms-3rd-edition',
          description: 'Standard textbook for CS algorithms course. Slightly worn cover, but no highlights inside. Perfect for second year students.',
          price: 450.0,
          stock: 1,
          status: 'APPROVED',
          isStudentListing: true,
          condition: 'GOOD',
          listingType: 'SELL',
          location: 'Hostel Block B'
        },
        {
          id: 'prod-kettle-1',
          sellerId,
          categoryId: 'cat-hostel',
          title: 'Electric Kettle 1.5L',
          slug: 'electric-kettle-hostel',
          description: 'Pre-owned Prestige electric kettle. Used for 1 year in PG. Working perfectly. Great for making late-night noodles and tea.',
          price: 299.0,
          stock: 1,
          status: 'APPROVED',
          isStudentListing: true,
          condition: 'GOOD',
          listingType: 'SELL',
          location: 'Sector 15 PG Area'
        },
        {
          id: 'prod-cycle-1',
          sellerId,
          categoryId: 'cat-cycles',
          title: 'Atlas Cycle (Gearless)',
          slug: 'atlas-cycle-campus',
          description: 'Cycle is in running condition, tires are inflated and brakes work. Perfect for riding from hostel to academic block. Key chain included.',
          price: 1500.0,
          stock: 1,
          status: 'APPROVED',
          isStudentListing: true,
          condition: 'FAIR',
          listingType: 'SELL',
          location: 'Hostel Block A Cycle Stand'
        }
      ];

      for (const prod of sampleProducts) {
        await sql`
          INSERT INTO "Product" (
            "id", "sellerId", "categoryId", "title", "slug", "description",
            "price", "stock", "status", "isStudentListing", "condition", "listingType", "location", "createdAt", "updatedAt"
          )
          VALUES (
            ${prod.id}, ${prod.sellerId}, ${prod.categoryId}, ${prod.title}, ${prod.slug}, ${prod.description},
            ${prod.price}, ${prod.stock}, ${prod.status}, ${prod.isStudentListing}, ${prod.condition}, ${prod.listingType}, ${prod.location}, NOW(), NOW()
          )
          ON CONFLICT ("slug") DO NOTHING;
        `;

        // Seed an image
        let imageUrl = '';
        if (prod.categoryId === 'cat-books') {
          imageUrl = 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500';
        } else if (prod.categoryId === 'cat-hostel') {
          imageUrl = 'https://images.unsplash.com/photo-1574269661127-73a2af3503a4?w=500';
        } else {
          imageUrl = 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500';
        }

        await sql`
          INSERT INTO "ProductImage" ("id", "productId", "url", "isPrimary", "createdAt")
          VALUES (${crypto.randomUUID()}, ${prod.id}, ${imageUrl}, true, NOW())
          ON CONFLICT DO NOTHING;
        `;
        console.log(`✅ Sample Product "${prod.title}" verified`);
      }
    } else {
      console.log('⚠️ No seller found to attach sample products. Run standard seed first.');
    }

    console.log('✅ Student categories and products seeded!');
  } catch (err) {
    console.error('❌ Failed to seed student database:', err);
  }
}
run();
