import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'chatbot_quick_help', timestamps: true })
export class QuickHelp extends Document {
  @Prop({ type: String, required: true })
  roleCode: string;

  @Prop({ type: String, required: true })
  question: string;

  @Prop({ type: Number, default: 0 })
  order: number; // Para ordenar las preguntas

  @Prop({ type: [String], required: false })
  keywords?: string[]; // Para búsquedas

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const QuickHelpSchema = SchemaFactory.createForClass(QuickHelp);

// Índices para mejor rendimiento
QuickHelpSchema.index({ roleCode: 1, isActive: 1 });
