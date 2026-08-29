import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentStatus, PaymentMethod, Role } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async checkout(userId: string, data: {
    addressId: string;
    paymentMethod: PaymentMethod;
    idempotencyKey?: string;
  }) {
    // 1. Idempotency Check
    if (data.idempotencyKey) {
      const existingOrder = await this.prisma.order.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
      if (existingOrder) {
        return existingOrder; // Return existing order directly
      }
    }

    // 2. Fetch shipping address
    const address = await this.prisma.address.findFirst({
      where: { id: data.addressId, userId },
    });
    if (!address) {
      throw new NotFoundException('Shipping address not found.');
    }

    // 3. Run entire checkout in a Prisma Transaction (prevents race conditions / stock concurrency bugs)
    const result = await this.prisma.$transaction(async (tx) => {
      // a. Fetch cart items
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Your cart is empty.');
      }

      // b. Verify stock and decrement
      let totalAmount = 0;
      const orderItemsData: any[] = [];
      const sellerIdsToNotify = new Set<string>();

      for (const item of cart.items) {
        const product = item.product;

        if (product.status !== 'APPROVED') {
          throw new BadRequestException(`Product "${product.title}" is no longer available.`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${product.title}". Requested: ${item.quantity}, Available: ${product.stock}`
          );
        }

        // Decrement stock (Atomic update inside transaction)
        const updatedProduct = await tx.product.update({
          where: { id: product.id },
          data: {
            stock: product.stock - item.quantity,
            // If stock becomes 0, optionally set status to OUT_OF_STOCK
            status: product.stock - item.quantity === 0 ? 'OUT_OF_STOCK' : 'APPROVED',
          },
        });

        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;

        orderItemsData.push({
          productId: product.id,
          sellerId: product.sellerId,
          quantity: item.quantity,
          price: product.price,
          subtotal,
        });

        sellerIdsToNotify.add(product.sellerId);
      }

      // c. Create the Order
      const shippingAddressJson = {
        name: address.name,
        phone: address.phone,
        street: address.street,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
      };

      const order = await tx.order.create({
        data: {
          buyerId: userId,
          totalAmount,
          status: data.paymentMethod === PaymentMethod.COD ? OrderStatus.CONFIRMED : OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          shippingAddress: shippingAddressJson,
          idempotencyKey: data.idempotencyKey || null,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      });

      // d. Create Payment entry
      await tx.payment.create({
        data: {
          orderId: order.id,
          method: data.paymentMethod,
          status: PaymentStatus.PENDING,
          amount: totalAmount,
        },
      });

      // e. Clear the cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // f. Create Notifications
      // For Buyer
      await tx.notification.create({
        data: {
          userId,
          title: 'Order Placed Successfully!',
          message: `Your order for ₹${totalAmount} has been placed. Status: ${order.status}.`,
        },
      });

      // For Sellers
      for (const sellerId of sellerIdsToNotify) {
        const sellerProfile = await tx.sellerProfile.findUnique({
          where: { id: sellerId },
        });
        if (sellerProfile) {
          await tx.notification.create({
            data: {
              userId: sellerProfile.userId,
              title: 'New Order Received!',
              message: `You have received a new order item for your shop "${sellerProfile.shopName}".`,
            },
          });
        }
      }

      return order;
    });

    return result;
  }

  async buyNow(userId: string, data: {
    productId: string;
    quantity: number;
    addressId: string;
    paymentMethod: PaymentMethod;
    idempotencyKey?: string;
  }) {
    // Idempotency check
    if (data.idempotencyKey) {
      const existing = await this.prisma.order.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
        include: { items: { include: { product: true } } },
      });
      if (existing) return existing;
    }

    // Fetch address
    const address = await this.prisma.address.findFirst({
      where: { id: data.addressId, userId },
    });
    if (!address) throw new NotFoundException('Shipping address not found.');

    // Fetch product
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
    });
    if (!product) throw new NotFoundException('Product not found.');
    if (product.status !== 'APPROVED') throw new BadRequestException('Product is no longer available.');
    if (product.stock < data.quantity) {
      throw new BadRequestException(`Only ${product.stock} items in stock.`);
    }

    const subtotal = product.price * data.quantity;
    const shippingAddressJson = {
      name: address.name, phone: address.phone, street: address.street,
      city: address.city, state: address.state, postalCode: address.postalCode, country: address.country,
    };

    const result = await this.prisma.$transaction(async (tx) => {
      // Decrement stock
      await tx.product.update({
        where: { id: product.id },
        data: {
          stock: product.stock - data.quantity,
          status: product.stock - data.quantity === 0 ? 'OUT_OF_STOCK' : 'APPROVED',
        },
      });

      // Create order
      const order = await tx.order.create({
        data: {
          buyerId: userId,
          totalAmount: subtotal,
          status: data.paymentMethod === PaymentMethod.COD ? OrderStatus.CONFIRMED : OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          shippingAddress: shippingAddressJson,
          idempotencyKey: data.idempotencyKey || null,
          items: {
            create: [{
              productId: product.id,
              sellerId: product.sellerId,
              quantity: data.quantity,
              price: product.price,
              subtotal,
            }],
          },
        },
        include: { items: { include: { product: { select: { title: true } } } } },
      });

      // Payment entry
      await tx.payment.create({
        data: { orderId: order.id, method: data.paymentMethod, status: PaymentStatus.PENDING, amount: subtotal },
      });

      // Notify buyer
      await tx.notification.create({
        data: { userId, title: 'Order Placed!', message: `Your order for ₹${subtotal} has been placed.` },
      });

      // Notify seller
      const sellerProfile = await tx.sellerProfile.findUnique({ where: { id: product.sellerId } });
      if (sellerProfile) {
        await tx.notification.create({
          data: { userId: sellerProfile.userId, title: 'New Order!', message: `New order for "${product.title}" from your shop.` },
        });
      }

      return order;
    });

    return result;
  }

  async getBuyerOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { buyerId: userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSellerOrders(sellerId: string) {
    // Find all orders that contain at least one item from this seller
    return this.prisma.order.findMany({
      where: {
        items: {
          some: { sellerId },
        },
      },
      include: {
        items: {
          where: { sellerId },
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderDetails(orderId: string, userId: string, role: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
            seller: {
              select: {
                shopName: true,
              },
            },
          },
        },
        payments: true,
        buyer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    const formattedOrder = {
      ...order,
      shippingAddress: order.shippingAddress,
    };

    // Auth verification
    if (role === Role.ADMIN) {
      return formattedOrder;
    }

    if (role === Role.BUYER && order.buyerId === userId) {
      return formattedOrder;
    }

    if (role === Role.SELLER) {
      // Verify seller owns at least one item in this order
      const sellerProfile = await this.prisma.sellerProfile.findUnique({
        where: { userId },
      });
      if (sellerProfile) {
        const hasSellerItem = order.items.some(item => item.sellerId === sellerProfile.id);
        if (hasSellerItem) {
          return {
            ...formattedOrder,
            items: order.items.filter(item => item.sellerId === sellerProfile.id),
          };
        }
      }
    }

    throw new ForbiddenException('You do not have access to this order.');
  }

  async updateOrderStatus(orderId: string, sellerUserId: string, role: Role, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (role !== Role.ADMIN) {
      const sellerProfile = await this.prisma.sellerProfile.findUnique({
        where: { userId: sellerUserId },
      });
      if (!sellerProfile) {
        throw new ForbiddenException('Seller profile not found.');
      }
      const hasSellerItem = order.items.some(item => item.sellerId === sellerProfile.id);
      if (!hasSellerItem) {
        throw new ForbiddenException('You do not own any items in this order.');
      }
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    // Notify buyer
    await this.prisma.notification.create({
      data: {
        userId: order.buyerId,
        title: 'Order Status Updated',
        message: `Your order #${order.id.slice(0, 8)} status is now ${status}.`,
      },
    });

    return updated;
  }
}
