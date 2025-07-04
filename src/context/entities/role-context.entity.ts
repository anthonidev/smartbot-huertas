import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'chatbot_role_contexts', timestamps: true })
export class RoleContext extends Document {
  @Prop({ type: String, required: true })
  roleCode: string; // 'SYS', 'VEN', 'ADM', etc.

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: [String], required: true })
  capabilities: string[];

  @Prop({ type: [String], required: true })
  commonQueries: string[];

  @Prop({ type: [String], required: true })
  workflows: string[];

  @Prop({ type: Object, required: false })
  metadata?: any; // Información adicional específica del rol

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const RoleContextSchema = SchemaFactory.createForClass(RoleContext);

// Índices para mejor rendimiento
RoleContextSchema.index({ roleCode: 1, isActive: 1 });
