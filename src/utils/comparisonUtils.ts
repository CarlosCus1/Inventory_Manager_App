import type { IProductoEditado } from '../interfaces';

export function calculateDataWithPercentages(
  lista: IProductoEditado[],
  competidores: string[]
): (IProductoEditado & Record<string, string | number | undefined>)[] {
  return lista.map(producto => {
    const precios = producto.precios || {};
    const p1 = precios[competidores[0]] || 0;
    const porcentajes: { [key: string]: string } = {};

    if (p1 > 0) {
      // Calcular porcentajes contra competidores
      for (let i = 1; i < competidores.length; i++) {
        const competidorActual = competidores[i];
        const pi = precios[competidorActual] || 0;
        if (pi > 0) {
          // Fórmula: ((Base / Competidor) - 1) * 100
          const ratio = (p1 / pi) - 1;
          porcentajes[`% vs ${competidorActual}`] = `${(ratio * 100).toFixed(2)}%`;
        } else {
          porcentajes[`% vs ${competidorActual}`] = 'N/A';
        }
      }

      // Calcular % Ajuste a Sugerido
      const precioSugerido = producto.precio_sugerido || 0;
      if (precioSugerido > 0) {
        // Fórmula: ((Sugerido / Base) - 1) * 100
        const ratioSugerido = (precioSugerido / p1) - 1;
        porcentajes['% Ajuste a Sugerido'] = `${(ratioSugerido * 100).toFixed(2)}%`;
      } else {
        porcentajes['% Ajuste a Sugerido'] = 'N/A';
      }

    } else {
      // Si no hay precio base, todos los cálculos son N/A
      for (let i = 1; i < competidores.length; i++) {
        porcentajes[`% vs ${competidores[i]}`] = 'N/A';
      }
      porcentajes['% Ajuste a Sugerido'] = 'N/A';
    }

    return { ...producto, ...porcentajes } as (IProductoEditado & Record<string, string | number | undefined>);
  });
}

export function calculateSummary(
  dataWithPercentages: (IProductoEditado & Record<string, string | number | undefined>)[],
  competidores: string[]
) {
  const pctHeaders = competidores.slice(1).map((comp) => `% vs ${comp}`);
  pctHeaders.push('% Ajuste a Sugerido'); // Usar el nuevo encabezado de ajuste
  const valores: number[] = [];

  for (const row of dataWithPercentages) {
    for (const h of pctHeaders) {
      const raw = (row as unknown as Record<string, string | undefined>)[h];
      if (!raw) continue;
      const num = parseFloat(raw.replace('%', '').replace(',', '.'));
      if (Number.isFinite(num)) valores.push(num);
    }
  }

  if (valores.length === 0) {
    return { min: 0, max: 0, n: 0 };
  }
  let min = valores[0];
  let max = valores[0];
  for (const v of valores) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max, n: valores.length };
}
