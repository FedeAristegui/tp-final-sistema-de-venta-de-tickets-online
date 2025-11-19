🎫 AllTickets - Sistema de Venta de Tickets Online

<div align="center">



**Sistema completo de gestión y venta de entradas para eventos**


</div>

---

##  Tabla de Contenidos

- [Sobre el Proyecto](#-sobre-el-proyecto)
- [Características Principales](#-características-principales)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Arquitectura](#-arquitectura)
- [Funcionalidades](#-funcionalidades)
- [API y Servicios](#-api-y-servicios)
- [Guards y Protección de Rutas](#-guards-y-protección-de-rutas)
- [Roadmap](#-roadmap)
- [Licencia](#-licencia)
- [Contacto](#-contacto)

---

##  Sobre el Proyecto

**AllTickets** es una aplicación web completa desarrollada con Angular 20 que permite la gestión integral de eventos y la venta de tickets online. El sistema incluye funcionalidades tanto para usuarios finales (compra de tickets, gestión de favoritos, historial) como para administradores (creación de eventos, gestión de descuentos, estadísticas).

### ¿Por qué AllTickets?

-  **Gestión completa de eventos**
-  **Sistema de descuentos**
-  **Carrito de compras**
-  **Panel de administración**
-  **Estadísticas**
-  **Gestión de usuarios**

---

##  Características Principales

### Para Usuarios

-  **Navegación de eventos**: Explora eventos disponibles con filtros y categorías
-  **Lista de favoritos**: Guarda tus eventos preferidos
-  **Carrito de compras**: Añade múltiples tickets antes de comprar
-  **Gestión de tarjetas**: Almacena métodos de pago de forma segura
-  **Historial de compras**: Revisa todas tus transacciones anteriores
-  **Perfil personalizado**: Gestiona tu información personal

### Para Administradores

-  **Creación de eventos**: Formulario completo con soporte para múltiples sectores/butacas
-  **Estadísticas**: Métricas detalladas de ventas y eventos
-  **Gestión de descuentos**: Crea y administra códigos promocionales
-  **Lista de eventos**: Visualiza y edita todos los eventos
-  **Detalles de eventos**: Información completa y edición inline

---

##  Tecnologías Utilizadas

### Front-end

- **Angular 20.3.0** - Framework 
- **TypeScript 5.9.2** - Lenguaje de programación
- **RxJS 7.8.0** - Programación reactiva
- **Angular Router** - Navegación 
- **Angular Reactive Forms** - Formularios reactivos

### Back-end (Simulado)

- **JSON Server** - API REST simulada con `db.json`



### Herramientas de Desarrollo

- **Angular CLI 20.3.8** - Herramienta de línea de comandos
- **Prettier** - Formateo de código
- **TypeScript Compiler** - Compilación

---

##  Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18.x o superior)
- **npm** (versión 9.x o superior)
- **Angular CLI** (versión 20.x o superior)

```bash
# Verificar versiones instaladas
node --version
npm --version
ng version
```

---

##  Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/tp-final-sistema-de-venta-de-tickets-online.git
cd tp-final-sistema-de-venta-de-tickets-online/ALLTICKETS/ALLTICKETS
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar la base de datos (JSON Server)

El proyecto utiliza JSON Server para simular una API REST. La base de datos se encuentra en `database/db.json`.

```bash
# Instalar JSON Server globalmente (si no lo tienes)
npm install -g json-server

# Iniciar JSON Server en el puerto 3000
json-server --watch database/db.json --port 3000
```

### 4. Iniciar la aplicación

```bash
# En una nueva terminal, iniciar el servidor de desarrollo
ng serve -o
```

La aplicación estará disponible en `http://localhost:4200/`

---

##  Uso

### Acceso como Usuario

1. Navega a `http://localhost:4200/`
2. Regístrate con un nuevo usuario o inicia sesión
3. Explora eventos disponibles
4. Añade eventos a favoritos o al carrito
5. Completa la compra

### Acceso como Administrador

1. Inicia sesión con credenciales de administrador:
   - **Email**: `agus@gmail.com`
   - **Contraseña**: `hola123`
2. Accede al panel de administración
3. Crea eventos, gestiona descuentos y visualiza estadísticas


---

## 📁 Estructura del Proyecto

```
ALLTICKETS/
├── src/
│   ├── app/
│   │   ├── cabecera/              # Componente de navegación
│   │   │   ├── cabecera.ts
│   │   │   ├── cabecera.html
│   │   │   ├── cabecera.css
│   │   │   └── cabecera.spec.ts
│   │   ├── carrito/               # Sistema de carrito de compras
│   │   │   ├── carrito.ts
│   │   │   ├── carrito.html
│   │   │   └── carrito.css
│   │   ├── descuento/             # Gestión de descuentos
│   │   │   ├── detalle-descuento/
│   │   │   ├── formulario-descuento/
│   │   │   └── lista-descuento/
│   │   ├── estadisticas/          # Panel de estadísticas
│   │   │   ├── estadisticas.ts
│   │   │   ├── estadisticas.html
│   │   │   └── estadisticas.css
│   │   ├── Evento/                # Gestión de eventos
│   │   │   ├── crear-evento/
│   │   │   ├── detalle-evento/
│   │   │   └── lista-evento/
│   │   ├── guards/                # Protección de rutas
│   │   │   ├── admin.guard.ts
│   │   │   ├── auth.guard.ts
│   │   │   ├── cliente.guard.ts
│   │   │   └── form.incompleto.guard.ts
│   │   ├── historial-compras/     # Historial de usuarios
│   │   │   ├── historial-compras.ts
│   │   │   ├── historial-compras.html
│   │   │   ├── historial-compras.css
│   │   │   └── historial-compras.spec.ts
│   │   ├── iniciar-sesion/        # Autenticación
│   │   │   ├── iniciar-sesion.ts
│   │   │   ├── iniciar-sesion.html
│   │   │   ├── iniciar-sesion.css
│   │   │   └── iniciar-sesion.spec.ts
│   │   ├── lista-favoritos/       # Favoritos del usuario
│   │   │   ├── lista-favoritos.ts
│   │   │   ├── lista-favoritos.html
│   │   │   └── lista-favoritos.css
│   │   ├── mis-tarjetas/          # Gestión de métodos de pago
│   │   │   ├── mis-tarjetas.ts
│   │   │   ├── mis-tarjetas.html
│   │   │   └── mis-tarjetas.css
│   │   ├── modelos/               # Modelos de datos TypeScript
│   │   │   ├── carrito.ts
│   │   │   ├── descuento.ts
│   │   │   ├── evento.ts
│   │   │   ├── favorito.ts
│   │   │   ├── tarjeta.ts
│   │   │   ├── usuario.ts
│   │   │   └── venta.ts
│   │   ├── pagina-principal/      # Landing page
│   │   │   ├── pagina-principal.ts
│   │   │   ├── pagina-principal.html
│   │   │   ├── pagina-principal.css
│   │   │   └── pagina-principal.spec.ts
│   │   ├── perfil-usuario/        # Perfil de usuario
│   │   │   ├── perfil-usuario.ts
│   │   │   ├── perfil-usuario.html
│   │   │   ├── perfil-usuario.css
│   │   │   └── perfil-usuario.spec.ts
│   │   ├── registrarse/           # Registro de usuarios
│   │   │   ├── registrarse.ts
│   │   │   ├── registrarse.html
│   │   │   ├── registrarse.css
│   │   │   └── registrarse.spec.ts
│   │   ├── servicios/             # Servicios de la aplicación
│   │   │   ├── autenticador.ts
│   │   │   ├── autenticador.spec.ts
│   │   │   ├── carrito.servicio.ts
│   │   │   ├── cliente-descuento.ts
│   │   │   ├── evento.servicio.ts
│   │   │   ├── evento.servicio.spec.ts
│   │   │   ├── favorito.servicio.ts
│   │   │   ├── tarjeta.servicio.ts
│   │   │   └── venta.servicio.ts
│   │   ├── app.config.ts          # Configuración de la app
│   │   ├── app.routes.ts          # Definición de rutas
│   │   ├── app.ts                 # Componente raíz
│   │   ├── app.html               # Template principal
│   │   ├── app.css                # Estilos del componente raíz
│   │   └── app.spec.ts            # Tests del componente raíz
│   ├── assets/                    # Recursos estáticos
│   ├── index.html                 # HTML principal
│   ├── main.ts                    # Entry point
│   └── styles.css                 # Estilos globales
├── database/
│   └── db.json                    # Base de datos JSON
├── public/                        # Archivos públicos
├── .angular/                      # Cache de Angular
├── .vscode/                       # Configuración de VS Code
├── angular.json                   # Configuración de Angular
├── package.json                   # Dependencias del proyecto
├── package-lock.json              # Lock de dependencias
├── tsconfig.json                  # Configuración de TypeScript
├── tsconfig.app.json              # Config TS para la app
├── tsconfig.spec.json             # Config TS para tests
├── .editorconfig                  # Configuración del editor
├── .gitignore                     # Archivos ignorados por Git
└── README.md                      # Este archivo
```
---

##  Arquitectura

### Patrón de Diseño

El proyecto sigue una arquitectura basada en componentes de Angular con las siguientes características:

- **Componentes**: Elementos reutilizables de la UI
- **Servicios**: Lógica de negocio y comunicación con API
- **Guards**: Protección de rutas según roles
- **Modelos**: Definición de tipos TypeScript
- **Routing**: Navegación declarativa con Angular Router

### Flujo de Datos

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│ Componentes │ ←──→ │  Servicios   │ ←──→ │ JSON Server │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │
       ↓                     ↓
  ┌─────────┐         ┌──────────┐
  │ Modelos │         │  Guards  │
  └─────────┘         └──────────┘
```

### Roles de Usuario

1. **Usuario/Cliente**: Puede comprar tickets, gestionar favoritos y tarjetas
2. **Administrador**: Gestiona eventos, descuentos y visualiza estadísticas
3. **Invitado**: Solo puede ver la página principal y detalle de eventos

---

##  Funcionalidades

### Gestión de Eventos

-  Crear eventos con título, fecha, hora, lugar, categoría
-  Soporte para múltiples sectores con capacidad y precios
-  Modo de venta: general o por sectores
-  Edición y actualización de eventos existentes
-  Eliminación de eventos

### Sistema de Descuentos

-  Creación de códigos promocionales para compras dentro de la página
-  Validez temporal de descuentos
-  Porcentaje fijo

### Carrito de Compras

-  Agregar múltiples tickets
-  Eliminar items
-  Cálculo automático de totales
-  Aplicación de códigos de descuento

### Gestión de Usuarios

-  Registro con validación
-  Inicio de sesión seguro
-  Perfil editable
-  Actualización de datos

---

##  API y Servicios

### AutenticadorService

```typescript
- login(email: string, password: string): Observable<Usuario>
- register(usuario: Usuario): Observable<Usuario>
- logout(): void
- getCurrentUser(): Usuario | null
```

### EventoService

```typescript
- getEventos(): Observable<Evento[]>
- getEvento(id: string): Observable<Evento>
- createEvento(evento: Evento): Observable<Evento>
- updateEvento(id: string, evento: Evento): Observable<Evento>
- deleteEvento(id: string): Observable<void>
```

### CarritoService

```typescript
- agregarAlCarrito(item: CarritoItem): void
- obtenerCarrito(): CarritoItem[]
- eliminarDelCarrito(id: string): void
- vaciarCarrito(): void
- calcularTotal(): number
```

### FavoritoService

```typescript
- agregarFavorito(eventoId: string): Observable<Favorito>
- obtenerFavoritos(usuarioId: string): Observable<Favorito[]>
- eliminarFavorito(id: string): Observable<void>
```

### VentaService

```typescript
- realizarVenta(venta: Venta): Observable<Venta>
- obtenerVentas(usuarioId: string): Observable<Venta[]>
```

### TarjetaService

```typescript
- agregarTarjeta(tarjeta: Tarjeta): Observable<Tarjeta>
- obtenerTarjetas(usuarioId: string): Observable<Tarjeta[]>
- eliminarTarjeta(id: string): Observable<void>
```

---

##  Guards y Protección de Rutas

### AuthGuard

Protege rutas que requieren autenticación (cualquier usuario logueado).

```typescript
// Rutas protegidas: perfil de usuario
canActivate: [authGuard]
```

### AdminGuard

Restringe acceso solo a usuarios con rol de administrador.

```typescript
// Rutas protegidas: eventos, descuentos, estadísticas
canActivate: [adminGuard]
```

### ClienteGuard

Permite acceso solo a usuarios con rol de cliente/usuario.

```typescript
// Rutas protegidas: carrito, favoritos, historial
canActivate: [clienteGuard]
```

### FormIncompletoGuard

Previene navegación si hay formularios sin guardar.

```typescript
// Protege pérdida de datos
canDeactivate: [formIncompletoGuard]
```



##  Roadmap

### Versión Actual (v1.0)

- [x] Sistema de autenticación
- [x] Gestión de eventos
- [x] Carrito de compras
- [x] Sistema de descuentos
- [x] Panel de administración
- [x] Historial de compras

### Próximas Funcionalidades

- [ ] Notificaciones por email
- [ ] Búsqueda avanzada con filtros
- [ ] Modo oscuro
- [ ] Integración con redes sociales





##  Licencia

Este proyecto es un trabajo académico desarrollado como proyecto final.

---

##  Contacto

**Equipo de Desarrollo AllTickets**

-  Email: agus@gmail.com


**Link del Proyecto**: [https://github.com/tu-usuario/tp-final-sistema-de-venta-de-tickets-online](https://github.com/tu-usuario/tp-final-sistema-de-venta-de-tickets-online)
