import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ChatbotService } from './chatbot.service';
import { SendMessageRequest } from './interfaces/message.interface';
import { ChatMessageService } from './services/ChatMessageService.service';

@Controller()
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly chatMessageService: ChatMessageService,
  ) {}

  @MessagePattern({ cmd: 'chatbot.send.message' })
  sendMessage(@Payload() data: SendMessageRequest) {
    return this.chatMessageService.sendMessage(data);
  }
}
