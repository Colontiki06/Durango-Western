import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar-admin',
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sidebar-admin.html',
  styleUrl: './sidebar-admin.css'
})
export class SidebarAdmin {}