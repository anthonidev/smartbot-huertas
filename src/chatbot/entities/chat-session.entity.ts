import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'chat_sessions', timestamps: true })
export class ChatSession extends Document {
  @Prop({ type: String, required: true })
  user: string;

  @Prop({ type: String, maxlength: 200, required: false })
  title?: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'ChatMessage' }] })
  messages: Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);
