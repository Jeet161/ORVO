/**
 * seed_users.cjs
 * Seeds demo users (admin, seller, buyer) directly into NeonDB via the
 * @neondatabase/serverless WebSocket driver — works even when port 5432 is blocked.
 *
 * Run: node seed_users.cjs
 */

const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

// ── Read DATABASE_URL from .env ───────────────────────────────────────────────
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
let DATABASE_URL = '';
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed.startsWith('DATABASE_URL=')) {
    DATABASE_URL = trimmed.slice('DATABASE_URL='.length).replace(/^["']|["']$/g, '').trim();
    break;
  }
}
if (!DATABASE_URL) { console.error('❌ DATABASE_URL not found in .env'); process.exit(1); }

const sql = neon(DATABASE_URL);

async function seed() {
  console.log('🌱 Seeding demo users into NeonDB...\n');

  // Pre-hash all passwords (bcrypt rounds = 10, matching auth.service.ts)
  const [adminHash, sellerHash, buyerHash] = await Promise.all([
    bcrypt.hash('admin123', 10),
    bcrypt.hash('seller123', 10),
    bcrypt.hash('buyer123', 10),
  ]);

  const adminId  = randomUUID();
  const sellerId = randomUUID();
  const buyerId  = randomUUID();

  // ── 1. Insert / upsert users ─────────────────────────────────────────────────
  const users = [
    { id: adminId,  email: 'admin@orvo.com',  name: 'ORVO Admin',  role: 'ADMIN',  hash: adminHash },
    { id: sellerId, email: 'seller@orvo.com', name: 'Demo Seller', role: 'SELLER', hash: sellerHash },
    { id: buyerId,  email: 'buyer@orvo.com',  name: 'Demo Buyer',  role: 'BUYER',  hash: buyerHash },
  ];

  for (const u of users) {
    await sql`
      INSERT INTO "User" ("id", "email", "passwordHash", "name", "role", "isEmailVerified", "createdAt", "updatedAt")
      VALUES (${u.id}, ${u.email}, ${u.hash}, ${u.name}, ${u.role}::"Role", true, NOW(), NOW())
      ON CONFLICT ("email") DO UPDATE
        SET "passwordHash" = EXCLUDED."passwordHash",
            "role"         = EXCLUDED."role",
            "name"         = EXCLUDED."name",
            "updatedAt"    = NOW()
      RETURNING "id", "email", "role"
    `;
    console.log(`  ✅ ${u.role.padEnd(6)} → ${u.email}`);
  }

  // ── 2. Get the actual seller user id (in case of conflict/existing row) ──────
  const [sellerUserRow] = await sql`SELECT "id" FROM "User" WHERE "email" = 'seller@orvo.com' LIMIT 1`;
  const sellerUserId = sellerUserRow.id;

  // ── 3. Create seller profile if not already present ──────────────────────────
  const sellerProfileId = randomUUID();
  await sql`
    INSERT INTO "SellerProfile"
      ("id", "userId", "shopName", "shopSlug", "region", "bio",
       "businessLicenseUrl", "idProofUrl", "status", "isVerified", "createdAt", "updatedAt")
    VALUES (
      ${sellerProfileId}, ${sellerUserId}, 'Demo Craft Shop', 'demo-craft-shop', 'Mumbai',
      'Handcrafted goods from Maharashtra artisans.',
      'https://example.com/license.pdf', 'https://example.com/id.pdf',
      'APPROVED', true, NOW(), NOW()
    )
    ON CONFLICT ("userId") DO UPDATE
      SET "status"     = 'APPROVED',
          "isVerified" = true,
          "updatedAt"  = NOW()
  `;
  console.log('  ✅ SELLER → SellerProfile created/updated (APPROVED)');

  // ── 4. Create base categories if missing ──────────────────────────────────────
  const categories = [
    { name: 'Clothing',    slug: 'clothing' },
    { name: 'Handicrafts', slug: 'handicrafts' },
    { name: 'Jewellery',   slug: 'jewellery' },
    { name: 'Food',        slug: 'food' },
    { name: 'Electronics', slug: 'electronics' },
  ];

  for (const cat of categories) {
    await sql`
      INSERT INTO "Category" ("id", "name", "slug", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, ${cat.name}, ${cat.slug}, NOW(), NOW())
      ON CONFLICT ("slug") DO NOTHING
    `;
  }
  console.log('  ✅ Categories seeded');

  console.log('\n🎉 Done! You can now log in with:');
  console.log('   Admin:  admin@orvo.com  / admin123');
  console.log('   Seller: seller@orvo.com / seller123');
  console.log('   Buyer:  buyer@orvo.com  / buyer123');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message || err);
  process.exit(1);
});
