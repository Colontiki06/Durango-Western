import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Address {
  id: number;
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface CustomerProfile {
  fullName: string;
  email: string;
  addresses: Address[];
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil {
  customer: CustomerProfile = {
    fullName: '',
    email: '',
    addresses: [],
  };

  newAddress: Address = {
    id: 0,
    street: '',
    city: '',
    state: '',
    zipCode: '',
  };

  editAddressData: Address = {
    id: 0,
    street: '',
    city: '',
    state: '',
    zipCode: '',
  };

  showAddAddressModal = false;
  showEditAddressModal = false;
  showEditProfileModal = false;

  addAddress() {
    this.customer.addresses.push({
      ...this.newAddress,
      id: Date.now(),
    });

    this.newAddress = {
      id: 0,
      street: '',
      city: '',
      state: '',
      zipCode: '',
    };

    this.showAddAddressModal = false;
  }

  openEditAddress(address: Address) {
    this.editAddressData = { ...address };
    this.showEditAddressModal = true;
  }

  saveEditedAddress() {
    const index = this.customer.addresses.findIndex(
      a => a.id === this.editAddressData.id
    );

    if (index !== -1) {
      this.customer.addresses[index] = { ...this.editAddressData };
    }

    this.showEditAddressModal = false;
  }

  deleteAddress(id: number) {
    this.customer.addresses = this.customer.addresses.filter(
      address => address.id !== id
    );
  }
}