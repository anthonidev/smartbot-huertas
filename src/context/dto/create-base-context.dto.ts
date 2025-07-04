import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateContextBaseDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsNotEmpty()
  value: any;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsString()
  @IsOptional()
  description?: string;
}
