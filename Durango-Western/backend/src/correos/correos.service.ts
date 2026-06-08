import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class CorreosService {
  private readonly logger = new Logger(CorreosService.name);

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

  private async enviarCorreo(data: {
    para: string;
    nombre: string;
    asunto: string;
    html: string;
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
      const respuesta = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
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
        },
        {
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

  private escapeHtml(value: string): string {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}