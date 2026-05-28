import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { ProductosService } from './productos.service';

@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

 @Get()
findAll() {
  return this.productosService.findAll();
}

@Get('slug/:slug')
findBySlug(@Param('slug') slug: string) {
  return this.productosService.findBySlug(slug);
}

@Get(':id')
findOne(@Param('id') id: string) {
  return this.productosService.findOne(id);
}

  @Post(':id/imagen')
  @UseInterceptors(FileInterceptor('imagen'))
  uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: any,
  ) {
    return this.productosService.uploadImage(id, file);
  }
}