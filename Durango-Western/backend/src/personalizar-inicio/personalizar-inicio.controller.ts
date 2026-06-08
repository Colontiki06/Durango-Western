import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PersonalizarInicioService } from './personalizar-inicio.service';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('personalizar-inicio')
export class PersonalizarInicioController {
  constructor(private readonly service: PersonalizarInicioService) {}

  @Get()
  obtenerTodo() {
    return this.service.obtenerTodo();
  }

  @Get('banners')
  obtenerBanners() {
    return this.service.obtenerBanners();
  }

  @Post('banners')
  crearBanner(@Body() body: any) {
    return this.service.crearBanner(body);
  }

  @Patch('banners/:id')
  actualizarBanner(@Param('id') id: string, @Body() body: any) {
    return this.service.actualizarBanner(id, body);
  }

  @Delete('banners/:id')
  eliminarBanner(@Param('id') id: string) {
    return this.service.eliminarBanner(id);
  }

  @Get('categorias')
  obtenerCategorias() {
    return this.service.obtenerCategorias();
  }

  @Post('categorias')
  crearCategoria(@Body() body: any) {
    return this.service.crearCategoria(body);
  }

  @Patch('categorias/:id')
  actualizarCategoria(@Param('id') id: string, @Body() body: any) {
    return this.service.actualizarCategoria(id, body);
  }

  @Delete('categorias/:id')
  eliminarCategoria(@Param('id') id: string) {
    return this.service.eliminarCategoria(id);
  }

  @Post('imagen')
@UseInterceptors(FileInterceptor('imagen'))
subirImagen(@UploadedFile() file: any) {
  return this.service.subirImagen(file);
}

}