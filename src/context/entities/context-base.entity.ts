import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'chatbot_context_base', timestamps: true })
export class ContextBase extends Document {
  @Prop({ type: String, required: true, unique: true })
  key: string; // 'system', 'assistant', 'baseInstructions', 'limitations'

  @Prop({ type: Object, required: true })
  value: any;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, required: false })
  description?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const ContextBaseSchema = SchemaFactory.createForClass(ContextBase);
