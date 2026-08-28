import { PrismaClient, Role, SellerStatus, ProductStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const sellerPasswordHash = await bcrypt.hash('seller123', 10);
  const buyerPasswordHash = await bcrypt.hash('buyer123', 10);

  // 1. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@orvo.com' },
    update: {},
    create: {
      email: 'admin@orvo.com',
      name: 'System Admin',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isEmailVerified: true,
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  // 2. Create Buyer
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@orvo.com' },
    update: {},
    create: {
      email: 'buyer@orvo.com',
      name: 'Jane Doe',
      passwordHash: buyerPasswordHash,
      role: Role.BUYER,
      isEmailVerified: true,
      addresses: {
        create: {
          name: 'Home Address',
          phone: '+919876543210',
          street: '123 Main Street, Phase 1',
          city: 'Chandigarh',
          state: 'Punjab',
          postalCode: '160001',
          isDefault: true,
        },
      },
    },
  });
  console.log(`Created buyer user: ${buyer.email}`);

  // 3. Create Seller User & Profile
  const sellerUser = await prisma.user.upsert({
    where: { email: 'seller@orvo.com' },
    update: {},
    create: {
      email: 'seller@orvo.com',
      name: 'Alpha Seller',
      passwordHash: sellerPasswordHash,
      role: Role.SELLER,
      isEmailVerified: true,
      sellerProfile: {
        create: {
          shopName: 'Alpha Craft Store',
          shopSlug: 'alpha-craft-store',
          region: 'Punjab',
          bio: 'Authentic handcrafted items from regional artisans.',
          businessLicenseUrl: 'https://placehold.co/600x400/png?text=Business+License',
          idProofUrl: 'https://placehold.co/600x400/png?text=ID+Proof',
          status: SellerStatus.APPROVED,
          isVerified: true,
        },
      },
    },
  });
  console.log(`Created seller user and profile for: ${sellerUser.email}`);

  // Get the created seller profile
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: sellerUser.id },
  });

  // 4. Create Categories
  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: { name: 'Electronics', slug: 'electronics' },
  });

  const audio = await prisma.category.upsert({
    where: { slug: 'audio' },
    update: {},
    create: { name: 'Audio', slug: 'audio', parentId: electronics.id },
  });

  const laptops = await prisma.category.upsert({
    where: { slug: 'laptops' },
    update: {},
    create: { name: 'Laptops', slug: 'laptops', parentId: electronics.id },
  });

  const homeDecor = await prisma.category.upsert({
    where: { slug: 'home-decor' },
    update: {},
    create: { name: 'Home Decor', slug: 'home-decor' },
  });

  const clothing = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: { name: 'Clothing', slug: 'clothing' },
  });

  console.log('Created categories tree');

  // 5. Create Sample Products
  if (sellerProfile) {
    // Product 1: Wireless Headphones
    await prisma.product.upsert({
      where: { slug: 'premium-wireless-headphones' },
      update: {},
      create: {
        sellerId: sellerProfile.id,
        categoryId: audio.id,
        title: 'Premium Wireless Headphones',
        slug: 'premium-wireless-headphones',
        description: 'Noise-cancelling over-ear wireless headphones with deep bass and 40h battery life.',
        price: 2499,
        stock: 15,
        status: ProductStatus.APPROVED,
        tags: 'wireless,headphones,audio,noise-cancelling',
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', isPrimary: true },
            { url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500', isPrimary: false }
          ],
        },
      },
    });

    // Product 2: Mechanical Keyboard
    await prisma.product.upsert({
      where: { slug: 'mechanical-rgb-keyboard' },
      update: {},
      create: {
        sellerId: sellerProfile.id,
        categoryId: electronics.id,
        title: 'Mechanical RGB Keyboard',
        slug: 'mechanical-rgb-keyboard',
        description: 'Tactile blue switches mechanical keyboard with customizable RGB backlighting.',
        price: 3499,
        stock: 8,
        status: ProductStatus.APPROVED,
        tags: 'keyboard,mechanical,rgb,gaming',
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500', isPrimary: true }
          ],
        },
      },
    });

    // Product 3: Ceramic Vase (Pending moderation)
    await prisma.product.upsert({
      where: { slug: 'handcrafted-ceramic-vase' },
      update: {},
      create: {
        sellerId: sellerProfile.id,
        categoryId: homeDecor.id,
        title: 'Handcrafted Ceramic Vase',
        slug: 'handcrafted-ceramic-vase',
        description: 'Artisanal ceramic flower vase crafted by hand in traditional Punjabi pottery patterns.',
        price: 1299,
        stock: 5,
        status: ProductStatus.PENDING,
        tags: 'ceramic,vase,handcrafted,decor',
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500', isPrimary: true }
          ],
        },
      },
    });

    console.log('Created sample products');
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
