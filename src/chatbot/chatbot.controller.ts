import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { User } from 'src/common/interfaces/user.interface';
import { SendMessageRequest } from './interfaces/message.interface';
import { ChatMessageService } from './services/ChatMessageService.service';
import { RateLimitService } from './services/rate-limit.service';

@Controller()
export class ChatbotController {
  constructor(
    private readonly chatMessageService: ChatMessageService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  @MessagePattern({ cmd: 'chatbot.send.message' })
  sendMessage(@Payload() data: SendMessageRequest) {
    return this.chatMessageService.sendMessage(data);
  }

  @MessagePattern({ cmd: 'chatbot.session.get-history' })
  getSessionHistory(@Payload() data: { user: User; sessionId: string }) {
    return this.chatMessageService.getSessionHistory(data.sessionId, data.user);
  }

  @MessagePattern({ cmd: 'chatbot.sessions.get-all' })
  getUserSessions(@Payload() data: { id: string }) {
    return this.chatMessageService.getUserSessions(data.id);
  }

  @MessagePattern({ cmd: 'chatbot.session.close' })
  closeSession(@Payload() data: { userId: string; sessionId: string }) {
    return this.chatMessageService.closeSession(data.sessionId, data.userId);
  }

  @MessagePattern({ cmd: 'chatbot.session.delete' })
  deleteSession(@Payload() data: { userId: string; sessionId: string }) {
    return this.chatMessageService.deleteSession(data.sessionId, data.userId);
  }

  @MessagePattern({ cmd: 'chatbot.rate-limit.status' })
  getRateLimitStatus(@Payload() user: User) {
    return this.rateLimitService.getRateLimitStatus(user);
  }

  @MessagePattern({ cmd: 'chatbot.rate-limit.can-request' })
  canMakeRequest(@Payload() data: { user: User; points?: number }) {
    return this.rateLimitService.canMakeRequest(data.user, data.points || 1);
  }
}
