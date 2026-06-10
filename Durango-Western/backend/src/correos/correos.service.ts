import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { ContactoDto } from './dto/contacto.dto';

interface RegistroRateLimit {
  intentos: number;
  inicioVentana: number;
}

@Injectable()
export class CorreosService {
  private readonly logger = new Logger(CorreosService.name);

  private readonly intentosContactoPorIp = new Map<string, RegistroRateLimit>();
  private readonly limiteMensajesContacto = 3;
  private readonly ventanaRateLimitMs = 10 * 60 * 1000;

  private readonly asuntosPermitidos = [
    'Duda sobre producto',
    'Estado de mi pedido',
    'Envíos',
    'Cambios o devoluciones',
    'Disponibilidad en tienda',
    'Facturación',
    'Otro',
  ];

  constructor(private readonly configService: ConfigService) {}

  async enviarCorreoBienvenida(data: {
    nombre: string;
    correo: string;
  }) {
    const asunto = 'Bienvenido a Durango Western';

    const html = `
      <div style="font-family: Arial, sans-serif; background:#f5ede1; padding:24px;">
        <div style="max-width:600px; margin:0 auto; background:#fff8ec; border-radius:14px; padding:28px; border:1px solid #e0d2bd;">
          <h1 style="color:#2f1b12; margin:0 0 12px;">Bienvenido a Durango Western</h1>

          <p style="color:#4b2e1f; font-size:16px;">
            Hola <strong>${this.escapeHtml(data.nombre)}</strong>,
          </p>

          <p style="color:#4b2e1f; font-size:16px; line-height:1.5;">
            Tu cuenta ha sido creada correctamente. Ahora puedes guardar direcciones,
            consultar tus pedidos y comprar más rápido.
          </p>

          <div style="margin-top:24px; padding:16px; background:#f3e3cc; border-radius:10px;">
            <p style="margin:0; color:#2f1b12; font-weight:bold;">
              Gracias por registrarte en Durango Western.
            </p>
          </div>
        </div>
      </div>
    `;

    return this.enviarCorreo({
      para: data.correo,
      nombre: data.nombre,
      asunto,
      html,
    });
  }

  async enviarCorreoPedidoCreado(data: {
    nombre: string;
    correo: string;
    pedidoId: string;
    total?: number;
  }) {
    const asunto = 'Confirmación de pedido - Durango Western';

    const totalTexto =
      data.total !== undefined
        ? new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
          }).format(data.total)
        : 'Por confirmar';

    const html = `
      <div style="font-family: Arial, sans-serif; background:#f5ede1; padding:24px;">
        <div style="max-width:600px; margin:0 auto; background:#fff8ec; border-radius:14px; padding:28px; border:1px solid #e0d2bd;">
          <h1 style="color:#2f1b12; margin:0 0 12px;">Recibimos tu pedido</h1>

          <p style="color:#4b2e1f; font-size:16px;">
            Hola <strong>${this.escapeHtml(data.nombre)}</strong>,
          </p>

          <p style="color:#4b2e1f; font-size:16px; line-height:1.5;">
            Tu pedido fue creado correctamente. Cuando el pago sea confirmado,
            comenzaremos con la preparación.
          </p>

          <div style="margin:22px 0; padding:16px; background:#f3e3cc; border-radius:10px;">
            <p style="margin:0 0 8px; color:#2f1b12;">
              <strong>Pedido:</strong> ${this.escapeHtml(data.pedidoId)}
            </p>
            <p style="margin:0; color:#2f1b12;">
              <strong>Total:</strong> ${totalTexto}
            </p>
          </div>

          <p style="color:#8a542f; font-size:14px;">
            Este correo es automático, por favor no respondas a este mensaje.
          </p>
        </div>
      </div>
    `;

    return this.enviarCorreo({
      para: data.correo,
      nombre: data.nombre,
      asunto,
      html,
    });
  }

  async enviarCorreoRecuperacionPassword(data: {
    nombre: string;
    correo: string;
    resetUrl: string;
  }) {
    const asunto = 'Restablece tu contraseña - Durango Western';

    const html = `
      <div style="font-family: Arial, sans-serif; background:#f5ede1; padding:24px;">
        <div style="max-width:600px; margin:0 auto; background:#fff8ec; border-radius:14px; padding:28px; border:1px solid #e0d2bd;">
          <h1 style="color:#2f1b12; margin:0 0 12px;">Restablece tu contraseña</h1>

          <p style="color:#4b2e1f; font-size:16px;">
            Hola <strong>${this.escapeHtml(data.nombre)}</strong>,
          </p>

          <p style="color:#4b2e1f; font-size:16px; line-height:1.5;">
            Recibimos una solicitud para cambiar la contraseña de tu cuenta.
            Da clic en el siguiente botón para crear una nueva contraseña.
          </p>

          <div style="margin:28px 0; text-align:center;">
            <a
              href="${this.escapeHtml(data.resetUrl)}"
              style="display:inline-block; background:#4b2e1f; color:#ffffff; text-decoration:none; padding:14px 24px; border-radius:10px; font-weight:bold;"
            >
              Cambiar contraseña
            </a>
          </div>

          <p style="color:#8a542f; font-size:14px; line-height:1.5;">
            Este enlace expirará en 30 minutos. Si tú no solicitaste este cambio,
            puedes ignorar este correo.
          </p>

          <p style="color:#8a542f; font-size:12px; line-height:1.5; margin-top:18px;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            ${this.escapeHtml(data.resetUrl)}
          </p>
        </div>
      </div>
    `;

    return this.enviarCorreo({
      para: data.correo,
      nombre: data.nombre,
      asunto,
      html,
    });
  }

  async enviarCorreoContacto(data: ContactoDto, ip: string) {
    this.validarRateLimitContacto(ip);

    const contacto = this.validarYLimpiarContacto(data);

    const correoDestino =
      this.configService.get<string>('CONTACT_EMAIL') ||
      this.configService.get<string>('BREVO_SENDER_EMAIL');

    if (!correoDestino) {
      return {
        enviado: false,
        motivo: 'CONTACT_EMAIL no configurado.',
      };
    }

    const asuntoCorreo = `Nuevo mensaje de contacto: ${contacto.asunto}`;

    const html = `
      <div style="font-family: Arial, sans-serif; background:#f5ede1; padding:24px;">
        <div style="max-width:650px; margin:0 auto; background:#fff8ec; border-radius:14px; padding:28px; border:1px solid #e0d2bd;">
          <h1 style="color:#2f1b12; margin:0 0 16px;">
            Nuevo mensaje desde Contáctanos
          </h1>

          <div style="background:#f3e3cc; border-radius:10px; padding:16px; margin-bottom:20px;">
            <p style="margin:0 0 8px; color:#2f1b12;">
              <strong>Nombre:</strong> ${this.escapeHtml(contacto.nombre)}
            </p>

            <p style="margin:0 0 8px; color:#2f1b12;">
              <strong>Correo:</strong> ${this.escapeHtml(contacto.correo)}
            </p>

            <p style="margin:0 0 8px; color:#2f1b12;">
              <strong>Asunto:</strong> ${this.escapeHtml(contacto.asunto)}
            </p>

            <p style="margin:0; color:#2f1b12;">
              <strong>IP:</strong> ${this.escapeHtml(ip)}
            </p>
          </div>

          <h2 style="color:#2f1b12; font-size:18px; margin:0 0 10px;">
            Mensaje
          </h2>

          <p style="color:#4b2e1f; font-size:16px; line-height:1.6; white-space:pre-line;">
            ${this.escapeHtml(contacto.mensaje)}
          </p>
        </div>
      </div>
    `;

    return this.enviarCorreo({
      para: correoDestino,
      nombre: 'Durango Western',
      asunto: asuntoCorreo,
      html,
      replyTo: {
        email: contacto.correo,
        name: contacto.nombre,
      },
    });
  }

  async enviarCorreoPrueba(data: {
    correo: string;
    nombre?: string;
  }) {
    return this.enviarCorreo({
      para: data.correo,
      nombre: data.nombre || 'Cliente',
      asunto: 'Correo de prueba - Durango Western',
      html: `
        <div style="font-family: Arial, sans-serif; background:#f5ede1; padding:24px;">
          <div style="max-width:600px; margin:0 auto; background:#fff8ec; border-radius:14px; padding:28px;">
            <h1 style="color:#2f1b12;">Correo de prueba</h1>
            <p style="color:#4b2e1f;">La integración con Brevo funciona correctamente.</p>
          </div>
        </div>
      `,
    });
  }

  private validarRateLimitContacto(ip: string): void {
    const ahora = Date.now();
    const registroActual = this.intentosContactoPorIp.get(ip);

    if (!registroActual) {
      this.intentosContactoPorIp.set(ip, {
        intentos: 1,
        inicioVentana: ahora,
      });

      return;
    }

    const ventanaExpirada =
      ahora - registroActual.inicioVentana > this.ventanaRateLimitMs;

    if (ventanaExpirada) {
      this.intentosContactoPorIp.set(ip, {
        intentos: 1,
        inicioVentana: ahora,
      });

      return;
    }

    if (registroActual.intentos >= this.limiteMensajesContacto) {
      throw new HttpException(
        'Has enviado demasiados mensajes. Intenta nuevamente más tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    registroActual.intentos += 1;
    this.intentosContactoPorIp.set(ip, registroActual);
  }

  private validarYLimpiarContacto(data: ContactoDto): {
    nombre: string;
    correo: string;
    asunto: string;
    mensaje: string;
  } {
    const nombre = String(data.nombre || '').trim();
    const correo = String(data.correo || '').trim().toLowerCase();
    const asunto = String(data.asunto || '').trim();
    const mensaje = String(data.mensaje || '').trim();
    const empresa = String(data.empresa || '').trim();

    if (empresa) {
      throw new BadRequestException('No se pudo enviar el mensaje.');
    }

    if (!nombre) {
      throw new BadRequestException('El nombre es obligatorio.');
    }

    if (nombre.length < 2) {
      throw new BadRequestException(
        'El nombre debe tener al menos 2 caracteres.',
      );
    }

    if (nombre.length > 100) {
      throw new BadRequestException(
        'El nombre no debe exceder 100 caracteres.',
      );
    }

    if (this.contieneHtmlOScript(nombre)) {
      throw new BadRequestException(
        'El nombre contiene contenido no permitido.',
      );
    }

    if (!correo) {
      throw new BadRequestException('El correo es obligatorio.');
    }

    if (correo.length > 120) {
      throw new BadRequestException(
        'El correo no debe exceder 120 caracteres.',
      );
    }

    if (!this.emailValido(correo)) {
      throw new BadRequestException('Ingresa un correo válido.');
    }

    if (!asunto) {
      throw new BadRequestException('El asunto es obligatorio.');
    }

    if (!this.asuntosPermitidos.includes(asunto)) {
      throw new BadRequestException('Selecciona un asunto válido.');
    }

    if (!mensaje) {
      throw new BadRequestException('El mensaje es obligatorio.');
    }

    if (mensaje.length < 10) {
      throw new BadRequestException(
        'El mensaje debe tener al menos 10 caracteres.',
      );
    }

    if (mensaje.length > 1000) {
      throw new BadRequestException(
        'El mensaje no debe exceder 1000 caracteres.',
      );
    }

    const textoCompleto = `${nombre} ${correo} ${asunto} ${mensaje}`.toLowerCase();

    if (this.contieneHtmlOScript(textoCompleto)) {
      throw new BadRequestException(
        'El mensaje contiene contenido no permitido.',
      );
    }

    if (this.tieneDemasiadosLinks(textoCompleto)) {
      throw new BadRequestException(
        'El mensaje contiene demasiados enlaces.',
      );
    }

    if (this.esTextoRepetitivo(mensaje)) {
      throw new BadRequestException(
        'El mensaje parece repetitivo o inválido.',
      );
    }

    if (this.contieneContenidoBloqueado(textoCompleto)) {
      throw new BadRequestException(
        'El mensaje contiene contenido no permitido.',
      );
    }

    return {
      nombre,
      correo,
      asunto,
      mensaje,
    };
  }

  private contieneHtmlOScript(texto: string): boolean {
    const patronesBloqueados = [
      /<script/i,
      /<\/script/i,
      /<iframe/i,
      /<\/iframe/i,
      /javascript:/i,
      /onerror=/i,
      /onload=/i,
      /<[^>]+>/i,
    ];

    return patronesBloqueados.some((patron) => patron.test(texto));
  }

  private tieneDemasiadosLinks(texto: string): boolean {
    const coincidencias = texto.match(
      /https?:\/\/|www\.|\.com|\.net|\.org|\.xyz|\.info/g,
    );

    return (coincidencias || []).length > 2;
  }

  private esTextoRepetitivo(texto: string): boolean {
    const limpio = texto.replace(/\s+/g, '').toLowerCase();

    if (limpio.length < 20) {
      return false;
    }

    const caracteresUnicos = new Set(limpio.split(''));

    if (caracteresUnicos.size <= 3) {
      return true;
    }

    const palabras = texto
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    if (palabras.length < 8) {
      return false;
    }

    const conteo = new Map<string, number>();

    for (const palabra of palabras) {
      conteo.set(palabra, (conteo.get(palabra) || 0) + 1);
    }

    return [...conteo.values()].some((cantidad) => cantidad >= 6);
  }

  private contieneContenidoBloqueado(texto: string): boolean {
    const palabrasBloqueadas = [
      'viagra',
      'casino',
      'apuestas',
      'bitcoin gratis',
      'crypto gratis',
      'ganar dinero rápido',
      'hack',
      'malware',
      'phishing',
      'seo backlinks',
      'loan',
      'free money',
      'adult',
      'porn',
    ];

    return palabrasBloqueadas.some((palabra) => texto.includes(palabra));
  }

  private async enviarCorreo(data: {
    para: string;
    nombre: string;
    asunto: string;
    html: string;
    replyTo?: {
      email: string;
      name: string;
    };
  }) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    const senderEmail = this.configService.get<string>('BREVO_SENDER_EMAIL');
    const senderName =
      this.configService.get<string>('BREVO_SENDER_NAME') || 'Durango Western';

    if (!apiKey || apiKey === 'pendiente') {
      this.logger.warn('BREVO_API_KEY no configurada. No se envió el correo.');

      return {
        enviado: false,
        motivo: 'BREVO_API_KEY no configurada.',
      };
    }

    if (!senderEmail) {
      this.logger.warn('BREVO_SENDER_EMAIL no configurado.');

      return {
        enviado: false,
        motivo: 'BREVO_SENDER_EMAIL no configurado.',
      };
    }

    try {
      const payload: any = {
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: data.para,
            name: data.nombre,
          },
        ],
        subject: data.asunto,
        htmlContent: data.html,
      };

      if (data.replyTo) {
        payload.replyTo = {
          email: data.replyTo.email,
          name: data.replyTo.name,
        };
      }

      const respuesta = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        payload,
        {
          timeout: 10000,
          headers: {
            accept: 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json',
          },
        },
      );

      return {
        enviado: true,
        messageId: respuesta.data?.messageId || null,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Error enviando correo Brevo: ${JSON.stringify(
            error.response?.data,
          )}`,
        );

        return {
          enviado: false,
          motivo: error.response?.data || error.message,
        };
      }

      this.logger.error('Error desconocido enviando correo.');

      return {
        enviado: false,
        motivo: 'Error desconocido enviando correo.',
      };
    }
  }

  private emailValido(email: string): boolean {
    if (!email) {
      return false;
    }

    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      return false;
    }

    if (email.includes('..')) {
      return false;
    }

    const [localPart, domain] = email.split('@');

    if (!localPart || !domain) {
      return false;
    }

    if (localPart.length > 64) {
      return false;
    }

    if (domain.length > 253) {
      return false;
    }

    return true;
  }

  private escapeHtml(value: string): string {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}