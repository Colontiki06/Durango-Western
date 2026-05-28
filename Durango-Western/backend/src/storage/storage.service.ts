import { Injectable } from '@nestjs/common';

import { createClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {

  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  async uploadProductImage(
  file: any,
) {

    const fileName =
      `${Date.now()}-${file.originalname}`;

    const { data, error } =
      await this.supabase.storage
        .from('productos')
        .upload(fileName, file.buffer, {

          contentType: file.mimetype,

          upsert: false,
        });

    if (error) {
      throw error;
    }

    const {
      data: publicUrlData,
    } = this.supabase.storage
      .from('productos')
      .getPublicUrl(fileName);

    return {
      path: data.path,
      url: publicUrlData.publicUrl,
    };
  }
}