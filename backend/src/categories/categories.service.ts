import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(name: string, slug: string, parentId?: string) {
    const existing = await this.prisma.category.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException('Category slug already exists');
    }

    if (parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    return this.prisma.category.create({
      data: {
        name,
        slug,
        parentId,
      },
    });
  }

  async findAll() {
    // Fetch all categories and build the tree structure in memory
    const allCategories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    const categoryMap = new Map<string, any>();
    allCategories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    const rootCategories: any[] = [];
    allCategories.forEach((cat) => {
      const mapped = categoryMap.get(cat.id);
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(mapped);
        } else {
          // If parent is deleted/missing, treat as root
          rootCategories.push(mapped);
        }
      } else {
        rootCategories.push(mapped);
      }
    });

    return rootCategories;
  }

  async findOne(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.prisma.category.delete({
      where: { id },
    });
    return { success: true };
  }
}
