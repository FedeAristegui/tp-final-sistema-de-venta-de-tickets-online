/*
 * ============================================================
 *  CONFIGURACIÓN DE GOOGLE MAPS  —  PEGÁ TU API KEY ACÁ ABAJO
 * ============================================================
 *
 * 1) Entrá a https://console.cloud.google.com/ y creá un proyecto.
 * 2) Activá estas 3 APIs (Google Maps Platform > APIs y servicios):
 *      - Maps JavaScript API   (obligatoria: dibuja el mapa)
 *      - Places API (New)      (el buscador de direcciones del admin)
 *      - Geocoding API         (completa la dirección al mover el pin)
 * 3) Creá una credencial de tipo "Clave de API" y pegala abajo.
 *
 * NOTA SOBRE SEGURIDAD: esta clave viaja al navegador, así que no es
 * secreta por diseño. La forma correcta de protegerla NO es esconderla,
 * sino restringirla en la consola de Google:
 * "Restricciones de aplicación" > "Sitios web" > agregá http://localhost:4200/*
 */
export const GOOGLE_MAPS_API_KEY = '';

/** Centro del mapa cuando un evento todavía no tiene ubicación cargada (Obelisco, CABA). */
export const CENTRO_POR_DEFECTO: google.maps.LatLngLiteral = {
  lat: -34.6037,
  lng: -58.3816,
};
