import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClaudeApiModule } from '../claude-api/claude-api.module';
import { ContextModule } from '../context/context.module';
import { DatabaseQueryService } from './agents/database-query.service';
import { QueryClassificationService } from './agents/query-clasification.service';
import { ResponseGenerationService } from './agents/response-generation.service';
import { TitleGenerationService } from './agents/title-generation.service';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { ChatMessage, ChatMessageSchema } from './entities/chat-message.entity';
import {
  ChatRateLimit,
  ChatRateLimitSchema,
} from './entities/chat-rate-limit.entity';
import { ChatSession, ChatSessionSchema } from './entities/chat-session.entity';
import { ChatMessageService } from './services/ChatMessageService.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatRateLimit.name, schema: ChatRateLimitSchema },
    ]),
    ClaudeApiModule,
    ContextModule,
  ],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    ChatMessageService,
    TitleGenerationService,
    QueryClassificationService,
    DatabaseQueryService,
    ResponseGenerationService,
  ],
  exports: [ChatMessageService],
})
export class ChatbotModule {}
