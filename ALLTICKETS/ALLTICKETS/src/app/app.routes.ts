import { Routes } from '@angular/router';
import { IniciarSesion } from './iniciar-sesion/iniciar-sesion';
import { Registrarse } from './registrarse/registrarse';
import { PaginaPrincipal } from './pagina-principal/pagina-principal';
import { AdminEventos } from './Evento/crear-evento/admin-eventos';
import { detalleEvento } from './Evento/detalle-evento/detalle-evento';
import { ListaEvento } from './Evento/lista-evento/lista-evento';
import { FormularioDescuento } from './descuento/formulario-descuento/formulario-descuento';
import { ListaDescuento } from './descuento/lista-descuento/lista-descuento';
import { DetalleDescuento } from './descuento/detalle-descuento/detalle-descuento';
import { PerfilUsuario } from './perfil-usuario/perfil-usuario';
import { ListaFavoritos } from './lista-favoritos/lista-favoritos';
import { MisTarjetas } from './mis-tarjetas/mis-tarjetas';
import { Carrito } from './carrito/carrito';
import { adminGuard} from './guards/admin.guard';
import { clienteGuard } from './guards/cliente.guard';
import { authGuard } from './guards/auth.guard';
import { formIncompletoGuard } from './guards/form.incompleto.guard';
import { HistorialCompras } from './historial-compras/historial-compras';
import { Estadisticas } from './estadisticas/estadisticas';



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
    title: 'Agregar Evento',
    canActivate: [adminGuard], canDeactivate: [formIncompletoGuard]
  },
  { 
    path: 'lista-eventos', component: ListaEvento,
    title: 'Listado de Eventos',
    canActivate: [adminGuard]
  },
  {
    path: 'ficha-evento/:id', component: detalleEvento,
    title: 'Detalle de Evento',
  },
  {
    path: 'formulario-descuento', component: FormularioDescuento,
    title: 'Formulario Descuento',
    canActivate: [adminGuard], canDeactivate: [formIncompletoGuard]
  },
  {
    path: 'lista-descuento', component: ListaDescuento,
    title: 'Lista Descuentos',
    canActivate: [adminGuard]
  },
  {
    path: 'ficha-descuento/:id', component: DetalleDescuento,
    title: 'Detalle de Descuento',
    canActivate: [adminGuard]
  },
  {
    path: 'perfil/:id', component: PerfilUsuario,
    title: 'Mi Perfil',
    canActivate: [authGuard]
  },
  {
    path: 'favoritos', component: ListaFavoritos,
    title: 'Mis Favoritos',
    canActivate: [clienteGuard]
  },
  {
    path: 'mis-tarjetas', component: MisTarjetas,
    title: 'Mis Tarjetas',
    canActivate: [clienteGuard]
  },
  {
    path: 'carrito', component: Carrito,
    title: 'Mi Carrito',
    canActivate: [clienteGuard]
  },
  {
    path: 'historial-compras', component: HistorialCompras,
    title: 'Historial de Compras',
    canActivate: [clienteGuard]
  },
  {
    path: 'estadisticas', component: Estadisticas,
    title: 'Estadísticas',
    canActivate: [adminGuard]
  },
  { 
    path: '**', redirectTo: 'menu-principal' 
  }// redirección en caso de ruta no válida
];
