import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Pedido {
  id: string;
  fecha: string;
  estado: string;
  producto: string;
  talla: string;
  total: number;
  imagen: string;
  metodoPago: string;
  metodoEnvio: string;
  direccion: string;
  guia: string;
  paqueteria: string;
  fechaEstimada: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  private readonly apiUrl = 'http://localhost:3000/api/pedidos';

  constructor(private http: HttpClient) {}

  getPedidosCliente(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.apiUrl}/mis-compras`);
  }

  getPedidoDetalle(id: string): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/${id}`);
  }

  getRastreoPedido(id: string): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/${id}/rastreo`);
  }

}