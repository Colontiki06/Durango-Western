import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { CorreosService } from '../correos/correos.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

interface UsuarioJwt {
  id: string;
  email: string;
  rol: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly correosService: CorreosService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const nombre = registerDto.nombre.trim();
    const email = registerDto.email.trim().toLowerCase();
    const password = registerDto.password;

    const usuarioExistente = await this.prisma.users.findFirst({
      where: {
        email,
      },
    });

    if (usuarioExistente) {
      throw new BadRequestException('El correo ya está registrado.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = randomUUID();
    const now = new Date();

    const resultado = await this.prisma.$transaction(async (tx) => {
      const usuario = await tx.users.create({
        data: {
          id: userId,
          aud: 'authenticated',
          role: 'authenticated',
          email,
          encrypted_password: passwordHash,
          email_confirmed_at: now,
          raw_app_meta_data: {
            provider: 'email',
            providers: ['email'],
          },
          raw_user_meta_data: {
            nombre,
          },
          created_at: now,
          updated_at: now,
          is_sso_user: false,
          is_anonymous: false,
        },
      });

      const perfil = await tx.profiles.create({
        data: {
          id: userId,
          nombre,
          correo: email,
          rol: 'cliente',
          activo: true,
          telefono: null,
          created_at: now,
          updated_at: now,
        },
      });

      return {
        usuario,
        perfil,
      };
    });

    try {
      const respuestaCorreo =
        await this.correosService.enviarCorreoBienvenida({
          nombre: resultado.perfil.nombre,
          correo: resultado.perfil.correo,
        });

      if (!respuestaCorreo?.enviado) {
        this.logger.warn(
          `No se pudo enviar correo de bienvenida a ${email}: ${JSON.stringify(
            respuestaCorreo,
          )}`,
        );
      }
    } catch {
      this.logger.warn(
        `Falló el correo de bienvenida para ${email}, pero el usuario sí fue creado.`,
      );
    }

    return this.generarRespuestaAuth({
      id: resultado.usuario.id,
      email: resultado.usuario.email || email,
      rol: resultado.perfil.rol || 'cliente',
      nombre: resultado.perfil.nombre,
      telefono: resultado.perfil.telefono,
      avatar_url: resultado.perfil.avatar_url,
    });
  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();
    const password = loginDto.password;

    const usuario = await this.prisma.users.findFirst({
      where: {
        email,
        deleted_at: null,
      },
    });

    if (!usuario || !usuario.encrypted_password) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    const passwordCorrecta = await bcrypt.compare(
      password,
      usuario.encrypted_password,
    );

    if (!passwordCorrecta) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    let perfil = await this.prisma.profiles.findUnique({
      where: {
        id: usuario.id,
      },
    });

    if (!perfil) {
      perfil = await this.prisma.profiles.create({
        data: {
          id: usuario.id,
          nombre: email.split('@')[0],
          correo: email,
          rol: 'cliente',
          activo: true,
          telefono: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    if (perfil.activo === false) {
      throw new UnauthorizedException('La cuenta está desactivada.');
    }

    await this.prisma.users.update({
      where: {
        id: usuario.id,
      },
      data: {
        last_sign_in_at: new Date(),
        updated_at: new Date(),
      },
    });

    return this.generarRespuestaAuth({
      id: usuario.id,
      email: usuario.email || email,
      rol: perfil.rol || 'cliente',
      nombre: perfil.nombre,
      telefono: perfil.telefono,
      avatar_url: perfil.avatar_url,
    });
  }

  async me(usuarioJwt: UsuarioJwt) {
    const perfil = await this.prisma.profiles.findUnique({
      where: {
        id: usuarioJwt.id,
      },
    });

    if (!perfil) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    return {
      id: perfil.id,
      nombre: perfil.nombre,
      email: perfil.correo,
      telefono: perfil.telefono,
      rol: perfil.rol || 'cliente',
      avatar_url: perfil.avatar_url,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();

    const usuario = await this.prisma.users.findFirst({
      where: {
        email,
        deleted_at: null,
      },
    });

    if (!usuario) {
      return {
        message:
          'Si el correo está registrado, recibirás instrucciones para cambiar tu contraseña.',
      };
    }

    const perfil = await this.prisma.profiles.findUnique({
      where: {
        id: usuario.id,
      },
    });

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.$executeRaw`
      update public.password_reset_tokens
      set used_at = now()
      where user_id = ${usuario.id}::uuid
      and used_at is null
    `;

    await this.prisma.$executeRaw`
      insert into public.password_reset_tokens (
        user_id,
        token_hash,
        expires_at
      )
      values (
        ${usuario.id}::uuid,
        ${tokenHash},
        ${expiresAt}
      )
    `;

    const frontendUrl = this.obtenerFrontendUrl(dto.frontendUrl);

    const resetUrl = `${frontendUrl}/restablecer-password?token=${encodeURIComponent(
      token,
    )}`;

    try {
      const respuestaCorreo =
        await this.correosService.enviarCorreoRecuperacionPassword({
          nombre: perfil?.nombre || usuario.email || 'Cliente',
          correo: usuario.email || email,
          resetUrl,
        });

      if (!respuestaCorreo?.enviado) {
        this.logger.warn(
          `No se pudo enviar correo de recuperación a ${email}: ${JSON.stringify(
            respuestaCorreo,
          )}`,
        );
      }
    } catch {
      this.logger.warn(`No se pudo enviar correo de recuperación a ${email}.`);
    }

    return {
      message:
        'Si el correo está registrado, recibirás instrucciones para cambiar tu contraseña.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const token = dto.token.trim();
    const password = dto.password;

    if (!token) {
      throw new BadRequestException('Token inválido.');
    }

    const tokenHash = this.hashToken(token);

    const registros = await this.prisma.$queryRaw<
      {
        id: string;
        user_id: string;
        expires_at: Date;
        used_at: Date | null;
      }[]
    >`
      select id, user_id, expires_at, used_at
      from public.password_reset_tokens
      where token_hash = ${tokenHash}
      limit 1
    `;

    const registro = registros[0];

    if (!registro) {
      throw new BadRequestException('El enlace no es válido o ya expiró.');
    }

    if (registro.used_at) {
      throw new BadRequestException('Este enlace ya fue utilizado.');
    }

    if (new Date(registro.expires_at).getTime() < Date.now()) {
      throw new BadRequestException('El enlace ya expiró.');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: {
          id: registro.user_id,
        },
        data: {
          encrypted_password: passwordHash,
          updated_at: new Date(),
        },
      });

      await tx.$executeRaw`
        update public.password_reset_tokens
        set used_at = now()
        where id = ${registro.id}::uuid
      `;
    });

    return {
      message: 'Contraseña actualizada correctamente.',
    };
  }

  private generarRespuestaAuth(usuario: {
    id: string;
    email: string;
    rol: string;
    nombre: string;
    telefono?: string | null;
    avatar_url?: string | null;
  }) {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1d',
    });

    return {
      accessToken,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        telefono: usuario.telefono || null,
        avatar_url: usuario.avatar_url || null,
      },
    };
  }

  private obtenerFrontendUrl(frontendUrlDesdeCliente?: string): string {
    const frontendUrl =
      frontendUrlDesdeCliente ||
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:4200';

    return frontendUrl.replace(/\/$/, '');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}