import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { clienteGuard } from './guards/cliente.guard';
import { authGuard } from './guards/auth.guard';
import { formIncompletoGuard } from './guards/form.incompleto.guard';

/**
 * Las pantallas se cargan bajo demanda (`loadComponent`). Antes se importaban
 * todas acá arriba, así que un visitante que sólo mira la portada se bajaba
 * igual el panel de administración, el mapa y el carrito.
 */
export const routes: Routes = [
  {
    path: '', redirectTo: 'menu-principal', pathMatch:'full'
  },
  {
    path: 'menu-principal',
    loadComponent: () => import('./pagina-principal/pagina-principal').then(m => m.PaginaPrincipal),
    title: 'Pagina Principal'
  },
  {
    path: 'login',
    loadComponent: () => import('./iniciar-sesion/iniciar-sesion').then(m => m.IniciarSesion),
    title: 'Inicio Sesion'
  },
  {
    path: 'registro',
    loadComponent: () => import('./registrarse/registrarse').then(m => m.Registrarse),
    title: 'Registrarse'
  },
  {
    path: 'recuperar-contrasena',
    loadComponent: () => import('./recuperar-contrasena/recuperar-contrasena').then(m => m.RecuperarContrasena),
    title: 'Recuperar Contraseña'
  },
  {
    path: 'eventos',
    loadComponent: () => import('./Evento/crear-evento/admin-eventos').then(m => m.AdminEventos),
    title: 'Agregar Evento',
    canActivate: [adminGuard], canDeactivate: [formIncompletoGuard]
  },
  {
    path: 'lista-eventos',
    loadComponent: () => import('./Evento/lista-evento/lista-evento').then(m => m.ListaEvento),
    title: 'Listado de Eventos',
    canActivate: [adminGuard]
  },
  {
    path: 'ficha-evento/:id',
    loadComponent: () => import('./Evento/detalle-evento/detalle-evento').then(m => m.detalleEvento),
    title: 'Detalle de Evento',
  },
  {
    path: 'formulario-descuento',
    loadComponent: () => import('./descuento/formulario-descuento/formulario-descuento').then(m => m.FormularioDescuento),
    title: 'Formulario Descuento',
    canActivate: [adminGuard], canDeactivate: [formIncompletoGuard]
  },
  {
    path: 'lista-descuento',
    loadComponent: () => import('./descuento/lista-descuento/lista-descuento').then(m => m.ListaDescuento),
    title: 'Lista Descuentos',
    canActivate: [adminGuard]
  },
  {
    path: 'ficha-descuento/:id',
    loadComponent: () => import('./descuento/detalle-descuento/detalle-descuento').then(m => m.DetalleDescuento),
    title: 'Detalle de Descuento',
    canActivate: [adminGuard]
  },
  {
    path: 'perfil/:id',
    loadComponent: () => import('./perfil-usuario/perfil-usuario').then(m => m.PerfilUsuario),
    title: 'Mi Perfil',
    canActivate: [authGuard]
  },
  {
    path: 'favoritos',
    loadComponent: () => import('./lista-favoritos/lista-favoritos').then(m => m.ListaFavoritos),
    title: 'Mis Favoritos',
    canActivate: [clienteGuard]
  },
  {
    path: 'mis-tarjetas',
    loadComponent: () => import('./mis-tarjetas/mis-tarjetas').then(m => m.MisTarjetas),
    title: 'Mis Tarjetas',
    canActivate: [clienteGuard]
  },
  {
    path: 'carrito',
    loadComponent: () => import('./carrito/carrito').then(m => m.Carrito),
    title: 'Mi Carrito',
    canActivate: [clienteGuard]
  },
  {
    path: 'historial-compras',
    loadComponent: () => import('./historial-compras/historial-compras').then(m => m.HistorialCompras),
    title: 'Historial de Compras',
    canActivate: [clienteGuard]
  },
  {
    path: 'estadisticas',
    loadComponent: () => import('./estadisticas/estadisticas').then(m => m.Estadisticas),
    title: 'Estadísticas',
    canActivate: [adminGuard]
  },
  {
    path: '**', redirectTo: 'menu-principal'
  }// redirección en caso de ruta no válida
];
