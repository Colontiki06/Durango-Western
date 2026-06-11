import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Ingresa un correo válido.' })
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  frontendUrl?: string;
}