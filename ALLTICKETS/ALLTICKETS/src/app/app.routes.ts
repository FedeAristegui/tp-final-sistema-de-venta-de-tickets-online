import { Routes } from '@angular/router';
import { IniciarSesion } from './iniciar-sesion/iniciar-sesion';
import { Registrarse } from './registrarse/registrarse';
import { PaginaPrincipal } from './pagina-principal/pagina-principal';
import { AdminEventos } from './admin-eventos/crearEvento/admin-eventos';
import { detalleEvento } from './detalle-evento/detalle-evento';



export const routes: Routes = [
  {path: '', component: PaginaPrincipal},
  { path: 'login', component: IniciarSesion },
  { path: 'registro', component: Registrarse },
  { path: 'eventos', component: AdminEventos},
  {path: 'ficha-evento/:id', component: detalleEvento},
  { path: '**', redirectTo: '' }  // redirección en caso de ruta no válida
];
