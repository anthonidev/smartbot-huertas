import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { envs } from './config/envs';
import { ChatbotModule } from './chatbot/chatbot.module';

@Module({
  imports: [
    MongooseModule.forRoot(envs.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    }),
    ChatbotModule,
  ],
})
export class AppModule {}
