import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsUrl()
  @IsNotEmpty()
  link: string;

  @IsString()
  @IsOptional()
  slug?: string;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  link?: string;

  @IsString()
  @IsOptional()
  slug?: string;
}
