import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { ProductosService } from './productos.service';

@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.productosService.findAll(query);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productosService.findBySlug(slug);
  }

  @Get(':id/relacionados')
  findRelacionados(@Param('id') id: string) {
    return this.productosService.findRelacionados(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productosService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.productosService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.productosService.update(id, body);
  }

  @Patch(':id/ocultar')
  ocultar(@Param('id') id: string) {
    return this.productosService.ocultar(id);
  }

  @Patch(':id/reactivar')
  reactivar(@Param('id') id: string) {
    return this.productosService.reactivar(id);
  }

  @Post(':id/variantes')
  createVariante(@Param('id') id: string, @Body() body: any) {
    return this.productosService.createVariante(id, body);
  }

  @Patch('variantes/:varianteId/stock')
  updateStockVariante(
    @Param('varianteId') varianteId: string,
    @Body() body: any,
  ) {
    return this.productosService.updateStockVariante(varianteId, body.stock);
  }

  @Post(':id/imagen')
  @UseInterceptors(FileInterceptor('imagen'))
  uploadImage(@Param('id') id: string, @UploadedFile() file: any) {
    return this.productosService.uploadImage(id, file);
  }

  @Patch('imagenes/:imagenId/principal')
  setImagenPrincipal(@Param('imagenId') imagenId: string) {
    return this.productosService.setImagenPrincipal(imagenId);
  }

  @Delete('imagenes/:imagenId')
  deleteImagen(@Param('imagenId') imagenId: string) {
    return this.productosService.deleteImagen(imagenId);
  }

  @Patch('imagenes/:imagenId/orden')
  updateOrdenImagen(@Param('imagenId') imagenId: string, @Body() body: any) {
    return this.productosService.updateOrdenImagen(
      imagenId,
      Number(body.orden),
    );
  }
}