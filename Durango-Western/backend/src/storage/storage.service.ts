import { BadRequestException, Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  );

  async uploadProductImage(file: any) {
    if (!process.env.SUPABASE_URL) {
      throw new BadRequestException('Falta SUPABASE_URL en .env');
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new BadRequestException('Falta SUPABASE_SERVICE_ROLE_KEY en .env');
    }

    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    if (!file.buffer) {
      throw new BadRequestException('El archivo no trae buffer');
    }

    const fileName = `${Date.now()}-${file.originalname}`;

    const { data, error } = await this.supabase.storage
      .from('productos')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Error Supabase Storage:', error);
      throw new BadRequestException(
        error.message || 'No se pudo subir la imagen a Supabase',
      );
    }

    const { data: publicUrlData } = this.supabase.storage
      .from('productos')
      .getPublicUrl(fileName);

    return {
      path: data.path,
      url: publicUrlData.publicUrl,
    };
  }
}