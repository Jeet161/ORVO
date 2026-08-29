// One-off migration script using the Neon serverless driver (HTTPS, no port 5432 needed)
const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = "postgresql://neondb_owner:npg_iEOCnaZoz2U3@ep-royal-salad-aypa6g3h-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(DATABASE_URL);

async function migrate() {
  console.log('Running VerificationToken migration via Neon serverless driver...');
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "VerificationToken" (
        "identifier" TEXT NOT NULL,
        "token"      TEXT NOT NULL,
        "expires"    TIMESTAMP(3) NOT NULL,
        CONSTRAINT "VerificationToken_identifier_token_key" UNIQUE ("identifier", "token")
      )
    `;
    console.log('✅ VerificationToken table created (or already exists).');

    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key"
      ON "VerificationToken"("token")
    `;
    console.log('✅ VerificationToken_token_key index created (or already exists).');

    console.log('✅ Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
