const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = "postgresql://neondb_owner:npg_iEOCnaZoz2U3@ep-royal-salad-aypa6g3h-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(DATABASE_URL);

async function run() {
  console.log('Running schema update via Neon serverless SQL...');
  try {
    // 1. Create table ChatMessage if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS "ChatMessage" (
        "id" TEXT NOT NULL,
        "senderId" TEXT NOT NULL,
        "receiverId" TEXT NOT NULL,
        "productId" TEXT,
        "message" TEXT NOT NULL,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('✅ ChatMessage table verified');

    // 2. Add columns to Product table if they don't exist
    try {
      await sql`ALTER TABLE "Product" ADD COLUMN "isStudentListing" BOOLEAN NOT NULL DEFAULT false;`;
      console.log('✅ Added isStudentListing to Product');
    } catch (e) {
      console.log('ℹ️ isStudentListing might already exist:', e.message);
    }

    try {
      await sql`ALTER TABLE "Product" ADD COLUMN "condition" TEXT;`;
      console.log('✅ Added condition to Product');
    } catch (e) {
      console.log('ℹ️ condition might already exist:', e.message);
    }

    try {
      await sql`ALTER TABLE "Product" ADD COLUMN "listingType" TEXT DEFAULT 'SELL';`;
      console.log('✅ Added listingType to Product');
    } catch (e) {
      console.log('ℹ️ listingType might already exist:', e.message);
    }

    try {
      await sql`ALTER TABLE "Product" ADD COLUMN "location" TEXT;`;
      console.log('✅ Added location to Product');
    } catch (e) {
      console.log('ℹ️ location might already exist:', e.message);
    }

    // Add foreign keys to ChatMessage
    try {
      await sql`ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE;`;
    } catch (e) {
      console.log('ℹ️ senderId FK might already exist:', e.message);
    }
    try {
      await sql`ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE;`;
    } catch (e) {
      console.log('ℹ️ receiverId FK might already exist:', e.message);
    }
    try {
      await sql`ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL;`;
    } catch (e) {
      console.log('ℹ️ productId FK might already exist:', e.message);
    }

    console.log('✅ Database migration complete!');
  } catch (err) {
    console.error('❌ Database migration failed:', err);
  }
}
run();
