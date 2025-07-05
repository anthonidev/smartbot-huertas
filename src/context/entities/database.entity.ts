import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'chatbot_database_access', timestamps: true })
export class DatabaseAccess extends Document {
  @Prop({ type: String, required: true, unique: true })
  roleCode: string; // 'SYS', 'VEN', 'ADM', etc.

  @Prop({ type: String, required: true })
  roleName: string;

  @Prop({ type: [String], required: true })
  allowedTables: string[]; // Nombres de las tablas que puede consultar

  @Prop({ type: String, required: true })
  databaseSchema: string; // Script SQL completo con CREATE TABLE, ALTER TABLE, sequences, índices, etc.

  @Prop({ type: [String], required: false })
  restrictedColumns?: string[]; // Columnas que no puede ver (ej: passwords, tokens)

  @Prop({ type: [String], required: false })
  allowedOperations?: string[]; // ['SELECT', 'INSERT', 'UPDATE', 'DELETE']

  @Prop({ type: Object, required: false })
  queryLimits?: {
    maxRows?: number;
    maxJoins?: number;
    timeoutSeconds?: number;
  };

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const DatabaseAccessSchema =
  SchemaFactory.createForClass(DatabaseAccess);

// Índices para mejor rendimiento
DatabaseAccessSchema.index({ roleCode: 1, isActive: 1 }, { unique: true });
