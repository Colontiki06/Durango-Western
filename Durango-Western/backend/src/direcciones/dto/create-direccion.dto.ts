import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDireccionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre_recibe!: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  telefono?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  calle!: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  numero?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  colonia?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ciudad!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  estado!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  codigo_postal!: string;

  @IsString()
  @IsOptional()
  @MaxLength(250)
  referencias?: string;

  @IsBoolean()
  @IsOptional()
  principal?: boolean;
}