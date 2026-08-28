import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env manually
const envPath = path.resolve(__dirname, './.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
let dbUrl = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.split('DATABASE_URL=')[1].replace(/"/g, '').trim();
    break;
  }
}

// Parse credentials out of URL
const urlParts = dbUrl.replace('postgresql://', '').split('@');
const credentials = urlParts[0];
const hostAndDb = urlParts[1].split('?')[0];
const hostOnly = hostAndDb.split('/')[0];

const cleanUrl = 'https://' + hostOnly.replace('-pooler', '') + '/sql';
const authHeader = 'Basic ' + Buffer.from(credentials).toString('base64');

console.log('Target HTTP endpoint:', cleanUrl);

async function executeSql(sqlText) {
  const response = await fetch(cleanUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
      'Neon-Connection-String': dbUrl
    },
    body: JSON.stringify({ query: sqlText }),
  });
  const data = await response.json();
  if (data.error || data.message) {
    throw new Error(data.error || data.message || JSON.stringify(data));
  }
  return data;
}

async function run() {
  console.log('Sending schema creation via HTTP Neon SQL endpoint...');

  try {
    const commands = [
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
      `DROP TABLE IF EXISTS "Notification" CASCADE;`,
      `DROP TABLE IF EXISTS "Review" CASCADE;`,
      `DROP TABLE IF EXISTS "Payment" CASCADE;`,
      `DROP TABLE IF EXISTS "OrderItem" CASCADE;`,
      `DROP TABLE IF EXISTS "Order" CASCADE;`,
      `DROP TABLE IF EXISTS "WishlistItem" CASCADE;`,
      `DROP TABLE IF EXISTS "CartItem" CASCADE;`,
      `DROP TABLE IF EXISTS "Cart" CASCADE;`,
      `DROP TABLE IF EXISTS "ProductImage" CASCADE;`,
      `DROP TABLE IF EXISTS "Product" CASCADE;`,
      `DROP TABLE IF EXISTS "Category" CASCADE;`,
      `DROP TABLE IF EXISTS "SellerProfile" CASCADE;`,
      `DROP TABLE IF EXISTS "Address" CASCADE;`,
      `DROP TABLE IF EXISTS "User" CASCADE;`,
      `DROP TYPE IF EXISTS "Role" CASCADE;`,
      `CREATE TYPE "Role" AS ENUM ('BUYER', 'SELLER', 'ADMIN');`,
      `DROP TYPE IF EXISTS "SellerStatus" CASCADE;`,
      `CREATE TYPE "SellerStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');`,
      `DROP TYPE IF EXISTS "ProductStatus" CASCADE;`,
      `CREATE TYPE "ProductStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'OUT_OF_STOCK');`,
      `DROP TYPE IF EXISTS "OrderStatus" CASCADE;`,
      `CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');`,
      `DROP TYPE IF EXISTS "PaymentStatus" CASCADE;`,
      `CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');`,
      `DROP TYPE IF EXISTS "PaymentMethod" CASCADE;`,
      `CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'ONLINE');`,
      `CREATE TABLE "User" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "name" TEXT,
        "phoneNumber" TEXT,
        "role" "Role" NOT NULL DEFAULT 'BUYER',
        "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );`,
      `CREATE UNIQUE INDEX "User_email_key" ON "User"("email");`,
      `CREATE TABLE "Address" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "street" TEXT NOT NULL,
        "city" TEXT NOT NULL,
        "state" TEXT NOT NULL,
        "postalCode" TEXT NOT NULL,
        "country" TEXT NOT NULL DEFAULT 'India',
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Address_pkey" PRIMARY KEY ("id"),
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );`,
      `CREATE TABLE "SellerProfile" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "shopName" TEXT NOT NULL,
        "shopSlug" TEXT NOT NULL,
        "region" TEXT NOT NULL,
        "bio" TEXT,
        "businessLicenseUrl" TEXT NOT NULL,
        "idProofUrl" TEXT NOT NULL,
        "status" "SellerStatus" NOT NULL DEFAULT 'PENDING',
        "rejectionReason" TEXT,
        "isVerified" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id"),
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );`,
      `CREATE UNIQUE INDEX "SellerProfile_userId_key" ON "SellerProfile"("userId");`,
      `CREATE UNIQUE INDEX "SellerProfile_shopName_key" ON "SellerProfile"("shopName");`,
      `CREATE UNIQUE INDEX "SellerProfile_shopSlug_key" ON "SellerProfile"("shopSlug");`,
      `CREATE TABLE "Category" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "parentId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Category_pkey" PRIMARY KEY ("id"),
        FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL
      );`,
      `CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");`,
      `CREATE TABLE "Product" (
        "id" TEXT NOT NULL,
        "sellerId" TEXT NOT NULL,
        "categoryId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "price" DOUBLE PRECISION NOT NULL,
        "stock" INTEGER NOT NULL,
        "status" "ProductStatus" NOT NULL DEFAULT 'PENDING',
        "tags" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Product_pkey" PRIMARY KEY ("id"),
        FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE CASCADE,
        FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
      );`,
      `CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");`,
      `CREATE TABLE "ProductImage" (
        "id" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "isPrimary" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id"),
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
      );`,
      `CREATE TABLE "Cart" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Cart_pkey" PRIMARY KEY ("id"),
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );`,
      `CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");`,
      `CREATE TABLE "CartItem" (
        "id" TEXT NOT NULL,
        "cartId" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id"),
        FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE,
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
      );`,
      `CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON "CartItem"("cartId", "productId");`,
      `CREATE TABLE "WishlistItem" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id"),
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
      );`,
      `CREATE UNIQUE INDEX "WishlistItem_userId_productId_key" ON "WishlistItem"("userId", "productId");`,
      `CREATE TABLE "Order" (
        "id" TEXT NOT NULL,
        "buyerId" TEXT NOT NULL,
        "totalAmount" DOUBLE PRECISION NOT NULL,
        "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
        "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
        "shippingAddress" JSONB NOT NULL,
        "idempotencyKey" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Order_pkey" PRIMARY KEY ("id"),
        FOREIGN KEY ("buyerId") REFERENCES "User"("id")
      );`,
      `CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");`,
      `CREATE TABLE "OrderItem" (
        "id" TEXT NOT NULL,
        "orderId" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "sellerId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "price" DOUBLE PRECISION NOT NULL,
        "subtotal" DOUBLE PRECISION NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id"),
        FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE,
        FOREIGN KEY ("productId") REFERENCES "Product"("id"),
        FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id")
      );`,
      `CREATE TABLE "Payment" (
        "id" TEXT NOT NULL,
        "orderId" TEXT NOT NULL,
        "method" "PaymentMethod" NOT NULL,
        "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
        "amount" DOUBLE PRECISION NOT NULL,
        "transactionId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
        FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE
      );`,
      `CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");`,
      `CREATE TABLE "Review" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "rating" INTEGER NOT NULL,
        "comment" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Review_pkey" PRIMARY KEY ("id"),
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
      );`,
      `CREATE TABLE "Notification" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );`
    ];

    for (const cmd of commands) {
      await executeSql(cmd);
    }

    console.log('✅ All tables successfully created on Neon PostgreSQL via HTTP!');
  } catch (error) {
    console.error('❌ Failed to execute migration SQL:', error);
  }
}

run();
