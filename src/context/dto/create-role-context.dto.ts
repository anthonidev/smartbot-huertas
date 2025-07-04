import {
  IsString,
  IsArray,
  IsOptional,
  IsNotEmpty,
  ArrayNotEmpty,
  IsObject,
  IsBoolean,
} from 'class-validator';

export class CreateRoleContextDto {
  @IsString()
  @IsNotEmpty()
  roleCode: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  capabilities: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  commonQueries: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  workflows: string[];

  @IsObject()
  @IsOptional()
  metadata?: any;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
