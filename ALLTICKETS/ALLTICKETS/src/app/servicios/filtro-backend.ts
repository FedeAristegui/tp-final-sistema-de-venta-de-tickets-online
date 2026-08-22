/**
 * Filtrado de registros del lado del cliente.
 *
 * ¿Por qué no se filtra en el backend con `?campo=valor`?
 * Porque json-server convierte a número los valores de query que parecen
 * numéricos, mientras que en esta base los ids se guardan como texto. Entonces
 * `?usuarioId=8486` compara el número 8486 contra el string "8486", no coinciden,
 * y la respuesta vuelve vacía: el usuario ve su carrito, sus tarjetas o su
 * historial en blanco aunque los datos existan.
 *
 * Como el volumen de datos de este proyecto es chico, traer la colección y
 * filtrarla acá es la opción simple que funciona con cualquier versión de
 * json-server. La comparación se hace con `String(...)` de los dos lados para
 * que no importe si el valor quedó guardado como número o como texto.
 */
export function coincideCon(
  registro: unknown,
  criterios: Record<string, string | number | undefined | null>
): boolean {
  if (registro === null || typeof registro !== 'object') return false;
  const fila = registro as Record<string, unknown>;

  return Object.entries(criterios).every(([campo, valor]) => {
    // Un criterio sin valor no filtra nada.
    if (valor === undefined || valor === null) return true;
    return String(fila[campo]) === String(valor);
  });
}
