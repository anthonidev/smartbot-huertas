import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'chatbot_system_guides', timestamps: true })
export class SystemGuide extends Document {
  @Prop({ type: String, required: true, unique: true })
  guideKey: string; // 'createUser', 'createProjectExcel', etc.

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: [String], required: true })
  applicableRoles: string[]; // ['SYS', 'ADM'] o ['ALL']

  @Prop({ type: [String], required: true })
  steps: string[];

  @Prop({ type: String, required: false })
  description?: string;

  @Prop({ type: Object, required: false })
  metadata?: any; // Keywords, categoría, etc.

  @Prop({ type: Number, default: 0 })
  priority: number; // Para ordenar guías

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const SystemGuideSchema = SchemaFactory.createForClass(SystemGuide);

// Índices para mejor rendimiento
SystemGuideSchema.index({ guideKey: 1, isActive: 1 });
