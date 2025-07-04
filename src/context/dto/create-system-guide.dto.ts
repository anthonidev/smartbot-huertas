import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  ArrayNotEmpty,
  IsObject,
} from 'class-validator';

export class CreateSystemGuideDto {
  @IsString()
  @IsNotEmpty()
  guideKey: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  applicableRoles: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  steps: string[];

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  metadata?: any;

  @IsNumber()
  @IsOptional()
  priority?: number;
}
