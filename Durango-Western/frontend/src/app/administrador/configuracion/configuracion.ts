import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css'
})
export class Configuracion {

  config = {
    nombreTienda: 'Durango Western',
    correo: 'contacto@durangowestern.com',
    telefono: '+52 618 000 0000',
    direccion: 'Durango, México',
    envioGratisDesde: 4000,
    estadoTienda: 'Activa',
    comprasInvitado: true,
    mostrarAgotados: false,
    carritoPersistente: true,
    adminNombre: 'Marco Antonio',
    adminCorreo: 'admin@durangowestern.com',
    rol: 'Administrador principal',
    ultimoAcceso: 'Hoy, 8:42 PM'
  };

}