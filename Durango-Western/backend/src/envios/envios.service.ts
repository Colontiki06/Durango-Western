import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnviosService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  private baseUrl(): string {
    return process.env.SKYDROPX_BASE_URL || 'https://pro.skydropx.com';
  }

  private async obtenerTokenSkydropx(): Promise<string> {
    const clientId = process.env.SKYDROPX_CLIENT_ID;
    const clientSecret = process.env.SKYDROPX_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Faltan credenciales de SkydropX');
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl()}/api/v1/oauth/token`,
        body.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );

    return response.data.access_token;
  }

  private esperar(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async probarConexionSkydropx() {
    const token = await this.obtenerTokenSkydropx();

    return {
      ok: true,
      message: 'Conexión con SkydropX correcta',
      tokenPreview: token.slice(0, 12) + '...',
    };
  }

  async obtenerDireccionesSkydropx() {
    const token = await this.obtenerTokenSkydropx();

    const response = await firstValueFrom(
      this.httpService.get(
        `${this.baseUrl()}/api/v1/address_templates`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ),
    );

    return response.data;
  }

  async obtenerCotizacion(id: string) {
    const token = await this.obtenerTokenSkydropx();

    const response = await firstValueFrom(
      this.httpService.get(
        `${this.baseUrl()}/api/v1/quotations/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ),
    );

    return response.data;
  }

  async cotizar(
    codigoPostal: string,
    subtotal: number,
    items: {
      variante_id: string;
      cantidad: number;
    }[],
  ) {
    let pesoTotal = 0;
    let largoMax = 30;
    let anchoMax = 20;
    let altoTotal = 10;

    for (const item of items) {
      const variante = await this.prisma.producto_variantes.findUnique({
        where: { id: item.variante_id },
      });

      if (!variante) continue;

      const cantidad = Number(item.cantidad);

      pesoTotal += Number(variante.peso_kg ?? 1) * cantidad;
      largoMax = Math.max(largoMax, Number(variante.largo_cm ?? 30));
      anchoMax = Math.max(anchoMax, Number(variante.ancho_cm ?? 20));
      altoTotal += Number(variante.alto_cm ?? 10) * cantidad;
    }

    if (pesoTotal <= 0) pesoTotal = 1;

    const envioGratis = subtotal >= 4000;
    const token = await this.obtenerTokenSkydropx();

    const quotationPayload = {
      quotation: {
        address_from: {
          address_template_id: process.env.SKYDROPX_ADDRESS_FROM_ID,
        },
        address_to: {
          country_code: 'MX',
          postal_code: codigoPostal,
          area_level1: 'Durango',
          area_level2: 'Durango',
          area_level3: 'Centro',
        },
        parcels: [
          {
            length: Math.ceil(largoMax),
            width: Math.ceil(anchoMax),
            height: Math.ceil(altoTotal),
            weight: Math.max(1, Math.ceil(pesoTotal)),
          },
        ],
      },
    };

    const crearCotizacion = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl()}/api/v1/quotations`,
        quotationPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    const quotationId = crearCotizacion.data.id;

    await this.esperar(2500);

    const cotizacionFinal = await firstValueFrom(
      this.httpService.get(
        `${this.baseUrl()}/api/v1/quotations/${quotationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ),
    );

    const tarifas = cotizacionFinal.data.rates ?? [];

    const tarifasDisponibles = tarifas
      .filter((rate: any) => rate.success === true && rate.total)
      .map((rate: any) => ({
        id: rate.id,
        paqueteria: rate.provider_display_name,
        servicio: rate.provider_service_name,
        total: Number(rate.total),
        dias: rate.days ?? 99,
        moneda: rate.currency_code,
      }))
      .sort((a: any, b: any) => a.total - b.total);

    if (tarifasDisponibles.length === 0) {
      throw new BadRequestException('No hay tarifas de envío disponibles');
    }

    const paqueteriasConfiables = [
      'DHL',
      'FEDEX',
      'ESTAFETA',
      'PAQUETEXPRESS',
    ];

    const normalizar = (texto: string) =>
      (texto || '')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const esConfiable = (tarifa: any) => {
      const paqueteria = normalizar(tarifa.paqueteria);

      return paqueteriasConfiables.some((nombre) =>
        paqueteria.includes(nombre),
      );
    };

    const opcionEconomica = tarifasDisponibles[0];

    const opcionRecomendada =
      [...tarifasDisponibles]
        .filter((tarifa: any) => esConfiable(tarifa))
        .filter((tarifa: any) => tarifa.id !== opcionEconomica?.id)
        .sort((a: any, b: any) => {
          const scoreA = Number(a.total) + Number(a.dias) * 10;
          const scoreB = Number(b.total) + Number(b.dias) * 10;

          return scoreA - scoreB;
        })[0] ??
      [...tarifasDisponibles]
        .filter((tarifa: any) => tarifa.id !== opcionEconomica?.id)
        .sort((a: any, b: any) => {
          const scoreA = Number(a.total) + Number(a.dias) * 10;
          const scoreB = Number(b.total) + Number(b.dias) * 10;

          return scoreA - scoreB;
        })[0] ??
      opcionEconomica;

    const opcionExpress =
      [...tarifasDisponibles]
        .filter((tarifa: any) =>
          tarifa.id !== opcionEconomica?.id &&
          tarifa.id !== opcionRecomendada?.id
        )
        .sort((a: any, b: any) => {
          if (Number(a.dias) === Number(b.dias)) {
            return Number(a.total) - Number(b.total);
          }

          return Number(a.dias) - Number(b.dias);
        })[0] ??
      [...tarifasDisponibles].sort((a: any, b: any) => {
        if (Number(a.dias) === Number(b.dias)) {
          return Number(a.total) - Number(b.total);
        }

        return Number(a.dias) - Number(b.dias);
      })[0];

    const tarifaGratisAutomatica =
      [...tarifasDisponibles]
        .filter((tarifa: any) => esConfiable(tarifa))
        .sort((a: any, b: any) => Number(a.total) - Number(b.total))[0] ??
      opcionEconomica;

    const tarifaSeleccionada = envioGratis
      ? tarifaGratisAutomatica
      : opcionRecomendada;

    const costoEnvio = envioGratis
      ? 0
      : Number(tarifaSeleccionada?.total ?? 0);

    return {
      codigoPostal,
      subtotal,
      pesoTotal,
      medidas: {
        largo: largoMax,
        ancho: anchoMax,
        alto: altoTotal,
      },
      envioGratis,
      costoEnvio,
      total: subtotal + costoEnvio,
      tarifaSeleccionada,
      tarifas: tarifasDisponibles,
      opcionEconomica,
      opcionRecomendada,
      opcionExpress,
      skydropxQuotationId: quotationId,
    };
  } 

async guardarGuia(
  id: string,
  numeroGuia: string,
  paqueteriaNombre?: string,
) {
  if (!numeroGuia || !numeroGuia.trim()) {
    throw new BadRequestException('El número de guía es obligatorio');
  }

  const envio = await this.prisma.envios.findUnique({
    where: { id },
  });

  if (!envio) {
    throw new BadRequestException('Envío no encontrado');
  }

  let paqueteriaId: string | null = envio.paqueteria_id ?? null;

  if (paqueteriaNombre && paqueteriaNombre.trim()) {
    const paqueteria = await this.prisma.paqueterias.findFirst({
      where: {
        nombre: {
          equals: paqueteriaNombre.trim(),
          mode: 'insensitive',
        },
        activa: true,
      },
    });

    if (!paqueteria) {
      throw new BadRequestException(
        `La paquetería "${paqueteriaNombre}" no existe o no está activa`,
      );
    }

    paqueteriaId = paqueteria.id;
  }

  return this.prisma.envios.update({
    where: { id },
    data: {
      numero_guia: numeroGuia.trim(),
      paqueteria_id: paqueteriaId,
      updated_at: new Date(),
    },
    include: {
      paqueterias: true,
    },
  });
}

}