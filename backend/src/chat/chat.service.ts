import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: string) {
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            slug: true,
            images: {
              take: 1,
              where: { isPrimary: true },
            },
          },
        },
      },
    });

    const conversationsMap = new Map<string, any>();
    for (const msg of messages) {
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!partner) continue;

      const key = partner.id;
      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, {
          partner,
          lastMessage: msg.message,
          lastMessageAt: msg.createdAt,
          isRead: msg.senderId === userId ? true : msg.isRead,
          product: msg.product,
        });
      }
    }
    return Array.from(conversationsMap.values());
  }

  async getMessages(userId: string, partnerId: string, productId?: string) {
    // Mark received messages as read
    await this.prisma.chatMessage.updateMany({
      where: {
        senderId: partnerId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return this.prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
        ...(productId ? { productId } : {}),
      },
      orderBy: { createdAt: 'asc' },
      include: {
        product: { select: { id: true, title: true, price: true, slug: true } },
      },
    });
  }

  async sendMessage(senderId: string, receiverId: string, message: string, productId?: string) {
    return this.prisma.chatMessage.create({
      data: {
        senderId,
        receiverId,
        message,
        productId,
      },
      include: {
        product: { select: { id: true, title: true, price: true, slug: true } },
      },
    });
  }
}
