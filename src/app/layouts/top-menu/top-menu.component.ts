import { Component } from '@angular/core';
import { ProfileMenuComponent } from './profile-menu/profile-menu.component';
import { MenuService } from '../../core/services/menu.service';

@Component({
  selector: 'app-top-menu',
  standalone: true,
  imports: [ProfileMenuComponent],
  templateUrl: './top-menu.component.html',
  styleUrls: ['./top-menu.component.scss'],
})
export class TopMenuComponent {
  constructor(public menuService: MenuService) {}

}
