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
      for (let i = 1; i < competidores.length; i++) {
        const pi = precios[competidores[i]] || 0;
        if (pi > 0) {
          const ratio = (p1 / pi) - 1;
          porcentajes[`% vs ${competidores[i]}`] = `${(ratio * 100).toFixed(2)}%`;
        } else {
          porcentajes[`% vs ${competidores[i]}`] = 'N/A';
        }
      }

      // Calcular % Descuento a Sugerido
      const precioSugerido = producto.precio_sugerido || 0;

      if (precioSugerido > 0 && p1 > 0) {
        const descuentoNecesario = ((p1 - precioSugerido) / p1) * 100;
        porcentajes['% Descuento a Sugerido'] = `${descuentoNecesario.toFixed(2)}%`;
      } else {
        porcentajes['% Descuento a Sugerido'] = 'N/A';
      }

    } else {
      for (let i = 1; i < competidores.length; i++) {
        porcentajes[`% vs ${competidores[i]}`] = 'N/A';
      }
      porcentajes['% Descuento a Sugerido'] = 'N/A';
    }

    return { ...producto, ...porcentajes } as (IProductoEditado & Record<string, string | number | undefined>);
  });
}

export function calculateSummary(
  dataWithPercentages: (IProductoEditado & Record<string, string | number | undefined>)[],
  competidores: string[]
) {
  const pctHeaders = competidores.slice(1).map((comp) => `% vs ${comp}`);
  pctHeaders.push('% Descuento a Sugerido'); // Usar el nuevo encabezado de descuento
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
