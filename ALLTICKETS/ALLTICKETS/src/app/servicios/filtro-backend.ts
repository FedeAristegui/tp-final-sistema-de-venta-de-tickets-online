
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
