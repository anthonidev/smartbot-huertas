import {
  IsString,
  IsArray,
  IsOptional,
  IsNotEmpty,
  ArrayNotEmpty,
  IsObject,
  IsBoolean,
  IsIn,
} from 'class-validator';

export class CreateDatabaseAccessDto {
  @IsString()
  @IsNotEmpty()
  roleCode: string;

  @IsString()
  @IsNotEmpty()
  roleName: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  allowedTables: string[];

  @IsString()
  @IsNotEmpty()
  databaseSchema: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  restrictedColumns?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @IsIn(['SELECT', 'INSERT', 'UPDATE', 'DELETE'], { each: true })
  allowedOperations?: string[];

  @IsObject()
  @IsOptional()
  queryLimits?: {
    maxRows?: number;
    maxJoins?: number;
    timeoutSeconds?: number;
  };

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
