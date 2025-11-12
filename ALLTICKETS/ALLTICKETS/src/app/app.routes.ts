import { Routes } from '@angular/router';
import { IniciarSesion } from './iniciar-sesion/iniciar-sesion';
import { Registrarse } from './registrarse/registrarse';
import { PaginaPrincipal } from './pagina-principal/pagina-principal';
import { AdminEventos } from './Evento/admin-eventos/crear-evento/admin-eventos';
import { detalleEvento } from './Evento/admin-eventos/detalle-evento/detalle-evento';
import { ListaEvento } from './Evento/admin-eventos/lista-evento/lista-evento';
import { FormularioDescuento } from './descuento/formulario-descuento/formulario-descuento';
import { ListaDescuento } from './descuento/lista-descuento/lista-descuento';
import { DetalleDescuento } from './descuento/detalle-descuento/detalle-descuento';



export const routes: Routes = [
  {
    path: '', redirectTo: 'menu-principal', pathMatch:'full'
  },
  {
    path: 'menu-principal', component: PaginaPrincipal,
    title: 'Pagina Principal'
  },
  {
    path: 'login', component: IniciarSesion,
    title: 'Inicio Sesion' 
  },
  {
    path: 'registro', component: Registrarse,
    title: 'Registrarse' 
  },
  {
    path: 'eventos', component: AdminEventos,
    title: 'Agregar Evento' 
  },
  { 
    path: 'lista-eventos', component: ListaEvento,
    title: 'Listado de Eventos' 
  },
  {
    path: 'ficha-evento/:id', component: detalleEvento,
    title: 'Detalle de Evento' 
  },
  {
    path: 'formulario-descuento', component: FormularioDescuento,
    title: 'Formulario Descuento' 
  },
  {
    path: 'lista-descuento', component: ListaDescuento,
    title: 'Lista Descuentos' 
  },
  {
    path: 'ficha-descuento/:id', component: DetalleDescuento,
    title: 'Detalle de Descuento' 
  },
  { 
    path: '**', redirectTo: '' 
  }// redirección en caso de ruta no válida
];
