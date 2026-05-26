import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PaymentMethod {
  id: number;
  cardHolder: string;
  cardNumber: string;
  expiration: string;
  brand: string;
}

@Component({
  selector: 'app-metodos-pago',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './metodos-pago.html',
  styleUrl: './metodos-pago.css'
})
export class MetodosPago {

  paymentMethods: PaymentMethod[] = [];

  showAddPaymentModal = false;

  newPaymentMethod: PaymentMethod = {
    id: 0,
    cardHolder: '',
    cardNumber: '',
    expiration: '',
    brand: '',
  };

  addPaymentMethod(): void {

    // Evita guardar si no seleccionó tarjeta
    if (!this.newPaymentMethod.brand) {
      return;
    }

    this.paymentMethods.push({
      ...this.newPaymentMethod,
      id: Date.now(),
    });

    this.newPaymentMethod = {
      id: 0,
      cardHolder: '',
      cardNumber: '',
      expiration: '',
      brand: '',
    };

    this.showAddPaymentModal = false;

  }

  deletePaymentMethod(id: number): void {

    this.paymentMethods = this.paymentMethods.filter(
      method => method.id !== id
    );

  }

}