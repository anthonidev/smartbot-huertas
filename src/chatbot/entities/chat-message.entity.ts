import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

@Schema({ collection: 'chat_messages', timestamps: true })
export class ChatMessage extends Document {
  @Prop({ type: Types.ObjectId, ref: 'ChatSession', required: true })
  session: Types.ObjectId;

  @Prop({ type: String, enum: MessageRole, required: true })
  role: MessageRole;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Object, required: false })
  metadata?: any;

  createdAt: Date;
  updatedAt: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
