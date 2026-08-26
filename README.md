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

**AllTickets** es una aplicación web completa desarrollada con Angular 20 (standalone components y signals ) que permite la gestión integral de eventos y la venta de tickets online. El sistema incluye funcionalidades tanto para usuarios finales (compra de tickets, gestión de favoritos, historial) como para administradores (creación de eventos, gestión de descuentos, estadísticas).

### ¿Por qué AllTickets?

-  **Gestión completa de eventos**, con ubicación en Google Maps
-  **Sistema de descuentos**
-  **Carrito de compras** con reserva temporizada de entradas
-  **Panel de administración**
-  **Estadísticas** con búsqueda y ranking de ventas
-  **Gestión de usuarios**
-  **Notificaciones por email** (confirmación de compra y recuperación de contraseña)
-  **Diseño responsive**, usable desde el celular

---

##  Características Principales

### Para Usuarios

-  **Navegación de eventos**: Explora eventos disponibles con filtros y categorías, sin necesidad de iniciar sesión
-  **Detalle de evento protegido**: para ver la ficha completa y comprar hace falta estar logueado
-  **Lista de favoritos**: Guarda tus eventos preferidos
-  **Carrito de compras**: Añade múltiples tickets antes de comprar, con una reserva temporizada de 10 minutos para no perder el stock elegido
-  **Gestión de tarjetas**: Almacena métodos de pago de forma segura (sólo se guardan los últimos 4 dígitos)
-  **Historial de compras**: Revisa todas tus transacciones anteriores
-  **Perfil personalizado**: Gestiona tu información personal
-  **Recuperación de contraseña**: código de 6 dígitos enviado por email, con vencimiento de 15 minutos
-  **Email de confirmación de compra**: resumen detallado por evento y por entrada, enviado automáticamente al pagar

### Para Administradores

-  **Creación de eventos**: Formulario completo con soporte para múltiples sectores/butacas, imagen (PNG o JPG, comprimida automáticamente) y ubicación en Google Maps
-  **Estadísticas**: Métricas detalladas de ventas y eventos, con buscador por nombre y tabla con scroll para no perder el ranking general
-  **Gestión de descuentos**: Crea y administra códigos promocionales
-  **Lista de eventos**: Visualiza y edita todos los eventos
-  **Detalles de eventos**: Información completa y edición inline

---

##  Tecnologías Utilizadas

### Front-end

- **Angular 20.3.0** - Framework, con *standalone components* y *signals*
- **Zoneless change detection** - sin Zone.js en runtime
- **TypeScript 5.9.2** - Lenguaje de programación
- **RxJS 7.8.0** - Programación reactiva
- **Angular Router** - Navegación, con *lazy loading* en todas las rutas y guards funcionales
- **Angular Reactive Forms** - Formularios reactivos

### Back-end (Simulado)

- **JSON Server** - API REST simulada con `db.json` (puerto 3000)
- **Express + Multer + CORS** (`server.js`) - servidor auxiliar para subir las imágenes de los eventos (puerto 3001)

### Integraciones Externas

- **EmailJS** (`@emailjs/browser`) - envío de mail de confirmación de compra y de recuperación de contraseña, con plantillas HTML propias
- **Google Maps JavaScript API** - selección de ubicación del evento y link "Ver en Google Maps"

### Herramientas de Desarrollo

- **Angular CLI 20.3.8** - Herramienta de línea de comandos
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

### 5. (Opcional) Servidor de subida de imágenes

Para poder subir la imagen de un evento hace falta levantar también el servidor auxiliar de `server.js` (Express + Multer), en otra terminal:

```bash
node server.js
```

Queda escuchando en `http://localhost:3001/`.


## 6. Configuración opcional: EmailJS y Google Maps

La aplicación utiliza dos servicios externos de manera opcional:

* **EmailJS:** permite enviar correos electrónicos desde la aplicación.
* **Google Maps:** permite mostrar y seleccionar ubicaciones mediante un mapa.

Estas configuraciones no son obligatorias para ejecutar el resto de la aplicación. Si no se configuran las claves, el sistema seguirá funcionando, pero no se podrán enviar correos electrónicos ni utilizar el selector de ubicación del mapa.

### 6.1. Configurar EmailJS

EmailJS permite enviar correos electrónicos directamente desde el frontend, sin necesidad de crear un servidor de correo propio.

#### Paso 1: Crear una cuenta

Ingresar a:

https://www.emailjs.com/

Crear una cuenta o iniciar sesión.

#### Paso 2: Crear un servicio de correo

Una vez dentro del panel de EmailJS:

1. Ir a **Email Services**.
2. Seleccionar **Add New Service**.
3. Elegir el proveedor de correo que se quiera utilizar.
4. Vincular la cuenta de correo.
5. Guardar la configuración.

EmailJS proporcionará un **Service ID**, que será necesario para la aplicación.

#### Paso 3: Crear una plantilla de correo

1. Ir a **Email Templates**.
2. Seleccionar **Create New Template**.
3. Crear la plantilla que utilizará la aplicación para enviar los correos.
4. Configurar las variables que utiliza el sistema.
5. Guardar la plantilla.

La plantilla tendrá un **Template ID**.

#### Paso 4: Obtener la Public Key

Desde el panel de EmailJS:

1. Ir a la sección de configuración de la cuenta.
2. Buscar la **Public Key**.
3. Copiarla.

Al finalizar, se tendrán tres datos:

* `Service ID`
* `Template ID`
* `Public Key`

#### Paso 5: Configurar la aplicación

Abrir el archivo:

```text
src/app/servicios/email.service.ts
```

y colocar los valores obtenidos de EmailJS en las constantes correspondientes.

Por ejemplo:

```typescript
private serviceId = 'TU_SERVICE_ID';
private templateId = 'TU_TEMPLATE_ID';
private publicKey = 'TU_PUBLIC_KEY';
```

> Los nombres exactos de las variables pueden variar según la implementación actual del proyecto.

Una vez configurado, la aplicación podrá utilizar EmailJS para enviar los correos correspondientes.

---

### 6.2. Configurar Google Maps

Google Maps se utiliza para mostrar el mapa y permitir seleccionar la ubicación de un evento.

#### Paso 1: Crear un proyecto en Google Cloud

Ingresar a:

https://console.cloud.google.com/

1. Iniciar sesión con una cuenta de Google.
2. Crear un nuevo proyecto.
3. Seleccionar el proyecto creado.

#### Paso 2: Habilitar las APIs necesarias

Desde **APIs & Services → Library**, buscar y habilitar las APIs necesarias para Google Maps.

Para una aplicación web que muestra mapas, normalmente se necesita:

* **Maps JavaScript API**

Si la aplicación utiliza servicios adicionales para obtener ubicaciones, direcciones o coordenadas, puede ser necesario habilitar también las APIs correspondientes.

#### Paso 3: Crear una API Key

Desde:

**APIs & Services → Credentials**

1. Seleccionar **Create Credentials**.
2. Elegir **API Key**.
3. Google generará una clave.
4. Copiar la API Key.

#### Paso 4: Configurar restricciones

Por seguridad, se recomienda restringir la API Key.

En la configuración de la clave:

* Seleccionar restricciones para aplicaciones web.
* Agregar los dominios desde los cuales se utilizará la aplicación.
* Restringir la clave únicamente a las APIs necesarias.

Durante el desarrollo local puede ser necesario permitir el acceso desde:

```text
http://localhost:4200
```

El puerto puede variar dependiendo de cómo se ejecute la aplicación.

#### Paso 5: Configurar la aplicación

Abrir:

```text
src/app/config/google-maps.config.ts
```

y colocar la API Key obtenida:

```typescript
export const GOOGLE_MAPS_CONFIG = {
  apiKey: 'TU_GOOGLE_MAPS_API_KEY'
};
```

> La estructura exacta puede variar según la implementación del proyecto.

Después de guardar la configuración, reiniciar la aplicación para que los cambios sean detectados.

---

### 6.3. Verificación

Una vez configurados ambos servicios:

#### EmailJS

Realizar una acción de la aplicación que envíe un correo y verificar que el mensaje llegue correctamente al destinatario.

#### Google Maps

Ingresar a la funcionalidad que permite seleccionar la ubicación de un evento y comprobar que el mapa se cargue correctamente.

---

### 6.4. Importante

Estas configuraciones son **opcionales**.

Si no se configuran EmailJS y Google Maps:

* La aplicación puede iniciarse normalmente.
* Los eventos, usuarios, ventas y demás funcionalidades continúan funcionando.
* No se podrán enviar correos mediante EmailJS.
* No se podrá utilizar el mapa de Google Maps.

Las claves de estos servicios son propias del proyecto y **no deben compartirse públicamente ni subirse a repositorios públicos sin las restricciones de seguridad correspondientes**.


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
-  Imagen del evento en PNG o JPG, comprimida en el navegador antes de guardarse
-  Ubicación opcional en Google Maps (lat/lng + dirección)
-  Soporte para múltiples sectores con capacidad y precios, o venta por butaca numerada
-  Edición y actualización de eventos existentes
-  Eliminación de eventos

### Sistema de Descuentos

-  Creación de códigos promocionales para compras dentro de la página
-  Validez temporal de descuentos
-  Porcentaje fijo

### Carrito de Compras

-  Agregar múltiples tickets (por sector o por butaca)
-  Reserva temporizada de 10 minutos desde el primer ítem agregado
-  Eliminar items
-  Cálculo automático de totales
-  Aplicación de códigos de descuento
-  Email de confirmación con el detalle de la compra al finalizar

### Gestión de Usuarios

-  Registro con validación
-  Inicio de sesión seguro
-  Recuperación de contraseña por código enviado al email
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

Protege rutas que requieren autenticación (cualquier usuario logueado, sin importar el rol).

```typescript
// Rutas protegidas: perfil de usuario y ficha/detalle de evento
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
- [x] Gestión de eventos (con imagen y ubicación en mapa)
- [x] Carrito de compras con reserva temporizada
- [x] Sistema de descuentos
- [x] Panel de administración
- [x] Historial de compras
- [x] Notificaciones por email (confirmación de compra y recuperación de contraseña)
- [x] Diseño responsive

### Próximas Funcionalidades

- [ ] Backend real (no simulado) con contraseñas hasheadas
- [ ] Pasarela de pago real
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
