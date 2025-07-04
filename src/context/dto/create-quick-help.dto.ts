import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateQuickHelpDto {
  @IsString()
  @IsNotEmpty()
  roleCode: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  questions: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  keywords?: string[];
}
