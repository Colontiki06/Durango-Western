import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarAdmin } from '../../administrador/componentes/sidebar-admin/sidebar-admin';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, SidebarAdmin],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayout {
  sidebarOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update(value => !value);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}