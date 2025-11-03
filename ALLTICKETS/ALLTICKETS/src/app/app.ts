import { Component, signal } from '@angular/core';
import { Registrarse } from './registrarse/registrarse';
import { HttpClientModule } from '@angular/common/http';
import { IniciarSesion } from './iniciar-sesion/iniciar-sesion';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [Registrarse, HttpClientModule,IniciarSesion],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('ALLTICKETS');
}
