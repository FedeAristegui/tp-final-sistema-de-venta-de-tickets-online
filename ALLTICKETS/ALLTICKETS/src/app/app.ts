import { Component, signal } from '@angular/core';
import { Registrarse } from './registrarse/registrarse';
import { HttpClientModule } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [Registrarse, HttpClientModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('ALLTICKETS');
}
