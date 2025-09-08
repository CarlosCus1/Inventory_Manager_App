Preview de cambios compactos para inputs y tablas

Objetivo
- Reducir la altura vertical de los inputs (por ejemplo de 55px a 44px).
- Aumentar espacio horizontal útil en inputs dentro de tablas y mantener la estética actual.
- Aplicarlo de forma segura como preview para revisión antes de cambiar `Input.tsx` o `StyledInput.tsx`.

Qué incluye este preview
1) CSS propuesto (añadir a `src/index.css` o copiar temporalmente para ver en el dev server)

```css
/* Compact utilities (preview) */
.table-compact th,
.table-compact td {
  /* celdas más apretadas */
  padding: 0.5rem 0.75rem; /* aprox px-3 py-2 */
}

.input-compact {
  box-sizing: border-box;
  height: 44px;
  min-height: 44px;
  padding: 0.25rem 0.5rem; /* px-2 py-1 */
  font-size: 0.875rem; /* text-sm */
  line-height: 1;
  border-radius: 0.375rem; /* rounded-md */
}

.table-compact input,
.table-compact textarea,
.table-compact .input {
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 44px;
  width: 100%;
}

/* Helpers de columnas para colgroup */
.col-name  { width: 40%; }
.col-qty   { width: 12%; }
.col-box   { width: 10%; }
.col-price { width: 10%; }
.col-weight{ width: 8%;  }
.col-obs   { width: 20%; }
```

2) Ejemplo de tabla con `colgroup` y `input-compact` (componente de ejemplo para copiar a `DataTable` o a tu tabla de reporte)

```tsx
// Ejemplo dentro del render de una tabla de reporte
<table className="min-w-full surface table-compact">
  <colgroup>
    <col className="col-name" />
    <col className="col-qty" />
    <col className="col-box" />
    <col className="col-price" />
    <col className="col-weight" />
    <col className="col-obs" />
  </colgroup>
  <thead>
    <tr>
      <th>Nombre</th>
      <th className="text-right">Cantidad</th>
      <th className="text-right">Cant./Caja</th>
      <th className="text-right">Precio</th>
      <th className="text-right">Peso</th>
      <th>Observaciones</th>
    </tr>
  </thead>
  <tbody>
    {rows.map(r => (
      <tr key={r.codigo}>
        <td><input className="input input-compact w-full" value={r.nombre} onChange={...} /></td>
        <td className="text-right"><input type="number" className="input input-compact w-full text-right" value={r.cantidad} onChange={...} /></td>
        <td className="text-right"><input type="number" className="input input-compact w-full text-right" value={r.cantCaja} onChange={...} /></td>
        <td className="text-right"><input type="number" className="input input-compact w-full text-right" value={r.precio} onChange={...} /></td>
        <td className="text-right"><input type="number" className="input input-compact w-full text-right" value={r.peso} onChange={...} /></td>
        <td><input className="input input-compact w-full" value={r.observaciones} onChange={...} /></td>
      </tr>
    ))}
  </tbody>
</table>
```

Cómo probarlo (manual, sin aplicar cambios globales)
- Abre `src/index.css` en tu editor y copia el bloque CSS "Compact utilities (preview)" al final del archivo. Guarda. Vite hará HMR y verás los cambios.
- En el componente de la tabla que quieras probar (p.ej. `InventarioPage` o `DataTable`), envuelve la etiqueta `table` con la clase `table-compact` y añade `colgroup` como en el ejemplo.
- Para inputs existentes, añade temporalmente `input-compact` al `className` de los `input` en esa tabla.

Si te gusta el resultado
- Puedo aplicar los cambios de forma definitiva: añadir `input-compact` a `Input.tsx` / `StyledInput.tsx` (cambio global) o pasar `compact`/`colClasses` en `DataTable` para hacerlo selectivo.

Siguiente paso
- Dime si quieres que aplique este preview directamente en archivos del proyecto para que puedas navegarlo en la app (haría cambios en `src/index.css` y en los lugares de tablas de reporte), o si prefieres probarlo manualmente copiando el CSS y las clases en los componentes que quieras revisar.

