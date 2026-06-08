import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Ingresa un correo válido.' })
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  email!: string;
}