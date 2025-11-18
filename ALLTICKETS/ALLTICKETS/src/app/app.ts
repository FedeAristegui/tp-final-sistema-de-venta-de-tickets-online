import { Component, signal } from '@angular/core';
import { Registrarse } from './registrarse/registrarse';
import { HttpClientModule } from '@angular/common/http';
import { IniciarSesion } from './iniciar-sesion/iniciar-sesion';
import { PaginaPrincipal } from './pagina-principal/pagina-principal';
import { RouterModule } from "@angular/router";
import { Cabecera } from "./cabecera/cabecera";


@Component({
  standalone: true,
  selector: 'app-root',
  imports: [HttpClientModule, RouterModule, Cabecera],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('ALLTICKETS');
}
