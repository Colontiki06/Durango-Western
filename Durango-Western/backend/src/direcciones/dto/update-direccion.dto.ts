import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateDireccionDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  nombre_recibe?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  telefono?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  calle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  numero?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  colonia?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  ciudad?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  estado?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  codigo_postal?: string;

  @IsString()
  @IsOptional()
  @MaxLength(250)
  referencias?: string;

  @IsBoolean()
  @IsOptional()
  principal?: boolean;
}