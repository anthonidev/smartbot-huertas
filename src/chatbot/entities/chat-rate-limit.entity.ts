import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'chat_rate_limits', timestamps: true })
export class ChatRateLimit extends Document {
  @Prop({ type: String, required: true })
  user: string;

  @Prop({ type: Date, required: true })
  windowStart: Date;

  @Prop({ type: Number, default: 0 })
  requestCount: number;

  @Prop({ type: Boolean, default: false })
  isBlocked: boolean;

  @Prop({ type: Date, required: false })
  blockedUntil?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ChatRateLimitSchema = SchemaFactory.createForClass(ChatRateLimit);

ChatRateLimitSchema.index({ user: 1, windowStart: 1 }, { unique: true });
