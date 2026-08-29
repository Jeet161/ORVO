-- Run this SQL on your Neon database if `prisma db push` is failing due to network issues.
-- Go to: https://console.neon.tech → Your Project → SQL Editor → paste and run this.

CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token"      TEXT NOT NULL UNIQUE,
    "expires"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VerificationToken_identifier_token_key" UNIQUE ("identifier", "token")
);
