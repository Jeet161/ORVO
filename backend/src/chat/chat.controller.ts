import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('conversations')
  async getConversations(@GetUser('id') userId: string) {
    return this.chatService.getConversations(userId);
  }

  @Get('messages/:partnerId')
  async getMessages(
    @GetUser('id') userId: string,
    @Param('partnerId') partnerId: string,
    @Query('productId') productId?: string,
  ) {
    return this.chatService.getMessages(userId, partnerId, productId);
  }

  @Post('send')
  async sendMessage(
    @GetUser('id') userId: string,
    @Body() body: { receiverId: string; message: string; productId?: string },
  ) {
    return this.chatService.sendMessage(userId, body.receiverId, body.message, body.productId);
  }
}
