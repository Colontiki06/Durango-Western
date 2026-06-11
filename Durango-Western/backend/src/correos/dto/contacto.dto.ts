import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ContactoDto {
  @IsString({ message: 'El nombre debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(100, { message: 'El nombre no debe exceder 100 caracteres.' })
  nombre!: string;

  @IsEmail({}, { message: 'Ingresa un correo válido.' })
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  @MaxLength(120, { message: 'El correo no debe exceder 120 caracteres.' })
  correo!: string;

  @IsString({ message: 'El asunto debe ser texto.' })
  @IsNotEmpty({ message: 'El asunto es obligatorio.' })
  @IsIn(
    [
      'Duda sobre producto',
      'Estado de mi pedido',
      'Envíos',
      'Cambios o devoluciones',
      'Disponibilidad en tienda',
      'Facturación',
      'Otro',
    ],
    { message: 'Selecciona un asunto válido.' },
  )
  asunto!: string;

  @IsString({ message: 'El mensaje debe ser texto.' })
  @IsNotEmpty({ message: 'El mensaje es obligatorio.' })
  @MinLength(10, { message: 'El mensaje debe tener al menos 10 caracteres.' })
  @MaxLength(1000, { message: 'El mensaje no debe exceder 1000 caracteres.' })
  mensaje!: string;

  /**
   * Honeypot anti-bots.
   * Este campo va oculto en el frontend.
   * Un usuario real no lo llena.
   */
  @IsOptional()
  @IsString()
  empresa?: string;
}