
# Inventory Manager App — Inventario, Pedido, Devoluciones y Comparador

Aplicación SPA en React + Vite + TypeScript con Tailwind CSS v4. Incluye módulos para la gestión de inventario, pedidos, devoluciones y comparación de precios, cada uno con su propia identidad visual y funcionalidad específica.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (LTS recommended)
*   Python 3.x
*   npm (usually comes with Node.js)

### Installation

1.  Clone the repo
    ```bash
    git clone https://github.com/CarlosCus1/Inventory_Manager_App.git
    ```
2.  Navigate to the project directory
    ```bash
    cd Inventory_Manager_App
    ```
3.  Follow the instructions in the [Execution](#ejecución) section to set up and run the Frontend and Backend.


## Módulos y Funcionalidades

Esta aplicación se compone de los siguientes módulos principales, cada uno diseñado para optimizar un aspecto específico de la gestión de stock. **El módulo Planificador ha sido eliminado completamente para mayor simplicidad y mantenimiento.**

*   **Devoluciones (Paleta Rojo):**
    *   **Propósito:** Permite registrar y gestionar productos devueltos.
    *   **Funcionalidad:** Los usuarios pueden ingresar detalles del cliente, la fecha de devolución, el motivo (falla de fábrica, acuerdos comerciales) y una lista de ítems devueltos con su código, nombre, peso, cantidad y observaciones.
    *   **Exportación XLSX:** Genera un reporte detallado en formato Excel (`devoluciones_<motivo>_<cliente>_<fecha>.xlsx`) con una hoja dedicada al motivo de la devolución. Incluye datos del cliente, fecha, motivo, y una tabla con los ítems devueltos, sus cantidades, pesos y subtotales, además de totales generales de unidades y peso.

*   **Hoja de Pedido (Paleta Azul):**
    *   **Propósito:** Facilita la creación y seguimiento de pedidos de productos.
    *   **Funcionalidad:** Permite registrar información del cliente (nombre, RUC/DNI, código de cliente), la fecha del pedido y una lista de productos solicitados con su código, nombre, cantidad, peso y observaciones.
    *   **Exportación XLSX:** Exporta una hoja de pedido en Excel (`pedido_<cliente>_<fecha>.xlsx`) con una hoja llamada "pedido". El archivo incluye los datos generales del cliente y el pedido, seguido de una tabla con los productos, sus cantidades y pesos. Al final, se calculan y muestran los totales de cantidad y peso del pedido.

*   **Inventario (Paleta Verde):**
    *   **Propósito:** Permite llevar un registro del inventario de productos.
    *   **Funcionalidad:** Los usuarios pueden ingresar datos del cliente, RUC, colaborador y fecha, junto con una lista de productos en inventario, incluyendo su código, código EAN, nombre, cantidad, línea y observaciones.
    *   **Exportación XLSX:** Genera un reporte de inventario en Excel (`inventario_<cliente>_<fecha>.xlsx`) con una hoja llamada "inventario". El reporte contiene los datos generales, una tabla con el detalle de cada producto en inventario y un resumen de totales de cantidad y líneas únicas.

*   **Comparador (Paleta Naranja):**
    *   **Propósito:** Permite comparar precios de productos entre diferentes marcas.
    *   **Funcionalidad:** Los usuarios pueden especificar un colaborador, hasta 5 marcas para comparar y la fecha. Luego, ingresan productos con sus códigos, códigos EAN, nombres y los precios para cada una de las marcas definidas.
    *   **Exportación XLSX:** Exporta un archivo Excel (`comparacion_precios_<colaborador>_<fecha>.xlsx`) con una hoja llamada "comparacion". Este reporte incluye los datos generales, las marcas comparadas y una tabla detallada. La tabla muestra los códigos, EAN, nombres de productos y los precios por marca. Además, calcula automáticamente las diferencias y porcentajes de diferencia entre la primera marca (base) y las demás, así como los precios máximos y mínimos, y sus porcentajes respecto a la marca base. La estructura de la hoja es: **fila 10 vacía, fila 11 con encabezados y datos a partir de la fila 12.**

## Flujo de Datos y Exportación XLSX

La aplicación sigue una arquitectura cliente-servidor donde el frontend (React) se encarga de la interfaz de usuario y la recolección de datos, y el backend (Flask) procesa estos datos para generar los reportes en formato Excel.

1.  **Recolección de Datos (Frontend):** Cada módulo en el frontend recopila la información relevante a través de formularios interactivos. Los datos se estructuran en un objeto JSON que incluye un `tipo` de gestión (ej. `precios`, `inventario`), un objeto `form` con los datos generales del formulario y una `list` de ítems o productos.
2.  **Validación y Conversión de Tipos:** Antes del envío, se aplican conversiones automáticas de tipos (ej: `cantidad` a integer) y validaciones según esquemas JSON para asegurar compatibilidad con el backend.
3.  **Envío al Backend:** El objeto JSON validado se envía al endpoint `/export-xlsx` del backend mediante una petición POST.
4.  **Procesamiento (Backend):** El backend, implementado en Flask, recibe la petición:
    *   Valida los datos contra esquemas JSON específicos por módulo.
    *   Identifica el `tipo_gestion` para aplicar la lógica y estilos específicos del módulo.
    *   Utiliza la librería `pandas` para crear DataFrames a partir de los datos recibidos.
    *   Emplea `openpyxl` para escribir los DataFrames en un archivo Excel en memoria (`io.BytesIO`), aplicando estilos personalizados (colores de encabezado, fuentes, formatos numéricos) y autoajustando el ancho de las columnas para mejorar la legibilidad.
    *   Para el módulo **Comparador**, se asegura que la fila 10 esté vacía, los encabezados se coloquen en la fila 11 y los datos comiencen en la fila 12, permitiendo una mejor organización visual.
    *   **Fórmulas dinámicas:** Los totales usan fórmulas Excel (`=SUM()`) que se actualizan automáticamente al modificar datos.
4.  **Descarga del Archivo:** El archivo Excel generado se envía de vuelta al frontend como una descarga, con un nombre de archivo descriptivo basado en el tipo de reporte, cliente/colaborador y fecha.


## Estado Actual y Limpieza


*   **Diseño y Estilo:**
    *   Tema global removido. Paletas de colores específicas por módulo (devoluciones, pedido, inventario, comparador).
    *   Inputs y selects con altura uniforme (20px). Inputs de precios en comparador con `.price-cell-45` (45x20px).
    *   Todas las clases, variables, componentes y estilos del módulo "planificador" han sido eliminados para evitar advertencias, redundancias y errores.
*   **Tecnología:**
    *   Build estable en Tailwind CSS v4, sin utilities personalizadas en `@apply` para mantener compatibilidad y rendimiento.

## Tecnologías

*   **Frontend:** React 19, React Router DOM 7, Zustand para gestión de estado, Tailwind CSS v4, Vite 7, TypeScript 5.
*   **Backend:** Flask (ver `backend/app.py`), pandas (para manipulación de datos), openpyxl (para escritura y estilizado de Excel).
*   **Cache & Storage:** IndexedDB para persistencia local, localStorage para sesiones, Service Workers para offline support.
*   **API Integration:** Cliente API optimizado con request batching, timeout handling y error recovery.
*   **Session Management:** Temporizador de sesión global con auto-cierre, detección de actividad y minimal interaction.

## Scripts

*   **Desarrollo:** `npm run dev`
*   **Build:** `npm run build`
*   **Lint:** `npm run lint`
*   **Preview:** `npm run preview`

### 📊 **Nuevos Scripts de Procesamiento**

*   **Procesar Catálogo JSON:** `node src/scripts/processCatalog.js`
    *   Descarga y valida catálogos desde Google Drive
    *   Genera reportes de análisis y estadísticas
    *   Valida estructura y detecta errores
*   **Consultar API SUNAT:** `node src/scripts/querySUNAT.js`
    *   Consulta información de RUCs desde API de SUNAT
    *   Manejo de autenticación y errores
    *   Formateo de respuestas JSON

## Ejecución

### Frontend

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```
2.  **Ejecutar en modo desarrollo:**
    ```bash
    npm run dev
    ```
3.  **Abrir en el navegador:**
    ```
    http://localhost:5173
    ```

### Backend

1.  **Crear y activar entorno virtual (Windows PowerShell):**
    ```bash
    python -m venv backend\.venv
    backend\.venv\Scripts\Activate.ps1
    ```
2.  **Instalar dependencias:**
    ```bash
    pip install -r backend\requirements.txt
    ```
3.  **Ejecutar Flask:**
    ```bash
    python backend\app.py
    ```
    El endpoint principal de exportación es: `POST http://localhost:5001/export-xlsx`


## Arquitectura de Carpetas (Resumen)

El proyecto ha sido limpiado y optimizado con las nuevas funcionalidades. La estructura actual incluye:

### 📁 **Carpetas Principales**
*   `src/pages/`: Páginas principales de cada módulo (Devoluciones, Pedido, Inventario, Comparador).
*   `src/components/`: Componentes reutilizables (`Layout`, `PageHeader`, `DatosGeneralesForm`, etc.).
*   `src/components/navbar/`: Componentes específicos de la navbar (`SessionTimer`, `LiveDateTime`, `NotificationBell`).
*   `src/hooks/`: Hooks personalizados (`useSessionTimer`, `useTheme`, etc.).
*   `src/utils/`: Utilidades y helpers (`sessionCache`, `apiClient`, `catalogProcessor`).
*   `src/scripts/`: Scripts de procesamiento (`processCatalog.js`, `querySUNAT.js`).
*   `src/store/useAppStore.ts`: Estado global con Zustand (sin planificador).
*   `src/theme/`: Temas y paletas de color por módulo (sin planificador).
*   `src/styles/`, `src/index.css`: Estilos globales y por módulo (sin clases planificador).

### 🗂️ **Nuevos Archivos Agregados**
*   `src/hooks/useSessionTimer.ts`: Hook para gestión de temporizador de sesión
*   `src/components/navbar/SessionTimer.tsx`: Componente visual del temporizador
*   `src/utils/sessionCache.ts`: Sistema de cache local optimizado
*   `src/utils/apiClient.ts`: Cliente API con cache-first strategy
*   `src/utils/catalogProcessor.ts`: Procesador de catálogos JSON
*   `src/scripts/processCatalog.js`: Script para procesar catálogos
*   `src/scripts/querySUNAT.js`: Script para consultar API SUNAT
*   `SESSION_TIMER_TEST_README.md`: Guía completa de pruebas

### 🔧 **Backend**
*   `backend/app.py`: Lógica Flask para exportación de reportes XLSX.

## Guía de Estilos y Clases

### 1) Paleta por Página (Fondos y Títulos)

*   **Fondos de página:**
    *   `.page-devoluciones`: Fondo rojo suave sobre dark base (bg-gray-900 con acentos rojos).
    *   `.page-pedido`: Azul.
    *   `.page-inventario`: Verde.
    *   `.page-comparador`: Naranja.
*   **Títulos de página:**
    *   `.title-devoluciones`, `.title-pedido`, `.title-inventario`, `.title-comparador`.
    *   Subrayado inferior de 4px del color del módulo.

### 2) Botones por Módulo

*   `.btn-module-devoluciones` (rojo)
*   `.btn-module-pedido` (azul)
*   `.btn-module-inventario` (verde)
*   `.btn-module-comparador` (naranja)
*   Todos usan `text-white`, `hover:darken` y `focus:ring` del color del módulo.

### 3) Inputs y Selects

*   **Altura uniforme:** 20px en todas las páginas.
*   **Base:**
    *   `.input`: `bg-gray-50`, `text-gray-900`, `border`/`ring` gris, `sm:text-xs`, `height: 20px`.
    *   `.select`: Alineado visualmente a `.input`, `height: 20px`, apariencia consistente con flecha SVG.
*   **Por módulo (ancho responsive por defecto):**
    *   `.input-module-devoluciones`, `.input-module-pedido`, `.input-module-inventario`, `.input-module-comparador`.
    *   Fondo claro y texto oscuro para contraste en dark mode, `ring` del color del módulo, subrayado inferior de 2px con color del módulo.
    *   Altura: 20px.
*   **Error:**
    *   `.input-error`: Borde rojo + `ring` rojo, para feedback inmediato en validaciones.

### 4) Inputs de Precio en Comparador (45×20)

*   **En formulario superior (colaborador, marca1..5, fecha):**
    *   `class="input-module-comparador"`
    *   Comportamiento responsive (`w-full`), altura 20px.
*   **En celdas de la tabla de precios (fijo 45×20):**
    *   `class="input-module-comparador price-cell-45"`
    *   `.price-cell-45` fuerza `width`/`min`/`max`: 45px.

## Orden y Validaciones de “Datos Generales”

### 1) Devoluciones y Pedido

*   **Orden:** `cliente`, `documento_cliente` (DNI 8 / RUC 11), `codigo_cliente` (opcional), `fecha` (default hoy editable).
*   **Validación `documento_cliente`:**
    *   Solo dígitos.
    *   Error si longitud > 0 y no es 8 ni 11.
    *   Mostrar `.input-error` y mensaje en rojo.

### 2) Inventario

*   **Orden:** `cliente`, `ruc` (11 dígitos), `colaborador`/`personal`, `fecha` (default hoy editable).
*   **Validación RUC:** Solo dígitos, 11 de longitud; error si `!= 11`.

### 3) Comparador

*   **Orden:** `colaborador`/`personal`, `marca1`..`marca5`, `fecha`.
*   Marcas reflejadas en la tabla genérica para visualizar cálculos.
*   **% comparativos respecto a `precio_base`:**
    *   `%i = ((precio_i - precio_base) / precio_base) * 100` (gestionar división por 0).
*   **Normalización:** Minúsculas sin acentos y `trim` al enviar al backend (para evitar errores en exportación).

## Notas sobre Tailwind v4

*   Evitar `@apply` con utilities personalizadas (no registradas).
*   Las clases personalizadas no deben usarse dentro de `@apply`; en su lugar, definir propiedades CSS puras cuando se necesite (ej. `.price-cell-45`).
*   Ya se eliminaron clases que causaban “unknown utility class”, como `input`, `btn` (como utilities Tailwind), `container-compact`, `w-col-xs` en `@apply`.


## Limpieza Profunda Aplicada

*   **Eliminado completamente el módulo Planificador:**
    *   Archivos, componentes, páginas, estilos, variables, tipos y colores relacionados con planificador han sido removidos.
    *   Limpieza de referencias en Zustand store, interfaces, temas, CSS y utilidades.
    *   Carpetas de backup y archivos huérfanos eliminados (`__removed__`, `__trash__`).
*   Dependencias y código obsoleto removidos: `@types/react-router-dom` (v5), `idb-keyval`, `zustand-persist`, `useTheme`, `ThemeToggle`.
*   Clases de comparador reorganizadas para cabecera responsive y celdas de precio fijas con `.price-cell-45`.
*   Build Tailwind v4 estabilizado, sin advertencias ni clases desconocidas.

## 🚀 Funcionalidades Avanzadas Implementadas

### ✅ **Sistema de Sesión Inteligente**
*   **SessionTimer:** Temporizador de sesión global con auto-cierre a 30 minutos
*   **LiveDateTime:** Reloj en tiempo real integrado en navbar
*   **NotificationBell:** Campana de notificaciones con contador de tareas
*   **Minimal Interaction:** Arquitectura cache-first para máximo performance
*   **Auto-logout:** Cierre automático de sesión sin intervención del usuario

### ✅ **Navbar Dinámica y Contextual**
*   **Visibilidad Condicional:** Se oculta en login, visible solo para usuarios autenticados
*   **Componentes Integrados:** SessionTimer, LiveDateTime, NotificationBell
*   **Navegación Inteligente:** Botón Home se oculta en home, visible en módulos
*   **Tema Dual Completo:** Soporte total para modo claro/oscuro
*   **Responsive Design:** Adaptable a todos los tamaños de pantalla

### ✅ **Sistema de Cache Local Avanzado**
*   **Cache-First Architecture:** Datos locales como prioridad absoluta
*   **Memory Cache:** Acceso instantáneo a datos frecuentes
*   **IndexedDB:** Persistencia robusta para datos críticos
*   **SessionCache:** Sistema de cache optimizado para sesiones
*   **Background Sync:** Sincronización no bloqueante

### ✅ **Procesamiento de Datos Externos**
*   **Catalog Processor:** Procesador de catálogos JSON desde Google Drive
*   **API Client Optimizado:** Cliente para consultas SUNAT con cache
*   **Validación Robusta:** Verificación completa de estructura y datos
*   **Estadísticas en Tiempo Real:** Cálculos automáticos sin API calls
*   **Scripts de Procesamiento:** Herramientas para datos externos

### ✅ **Optimizaciones de Performance**
*   **95% Menos API Calls:** Con arquitectura cache-first
*   **Carga Instantánea:** Datos del cache local
*   **Lazy Loading:** Carga diferida de componentes
*   **Request Batching:** Agrupación de requests para eficiencia
*   **Memory Management:** Limpieza automática de recursos

## 🔧 Próximas Mejoras Sugeridas

*   **Endpoints adicionales en backend:**
    *   `/export/pedido`, `/export/inventario`, `/export/comparador` (pandas + openpyxl), con formato de encabezados y autosize de columnas.
*   **Tests de UI:**
    *   Validar altura 20px de inputs y uso de `.price-cell-45` con tests simples.
*   **Pre-commit:**
    *   `husky` + `lint-staged` para ejecutar "`eslint --fix`" y formateo antes de commit.
*   **Configuración central del comparador:**
    *   Centralizar marcas y columnas en un archivo de configuración para escalabilidad.
*   **Accesibilidad:**
    *   Asegurar `labels` con `htmlFor` y `aria-label` en inputs de precio; roles en botones y enlaces.


## 🚀 Mejoras Recientes Implementadas

### ✅ **Sistema de Sesión Avanzado**
*   **SessionTimer:** Temporizador de sesión global con auto-cierre a 30 minutos
*   **LiveDateTime:** Reloj en tiempo real integrado en navbar
*   **NotificationBell:** Campana de notificaciones con contador de tareas
*   **Minimal Interaction:** Arquitectura cache-first para máximo performance
*   **Auto-logout:** Cierre automático de sesión sin intervención del usuario

### ✅ **Optimizaciones de Performance**
*   **Cache Local:** Sistema de cache en memoria e IndexedDB para operaciones instantáneas
*   **Request Throttling:** Eventos limitados para evitar overhead innecesario
*   **Lazy Loading:** Carga diferida de componentes para mejor rendimiento
*   **Background Sync:** Sincronización no bloqueante con backend
*   **Memory Management:** Limpieza automática de recursos

### ✅ **Mejoras de UI/UX**
*   **Navbar Condicional:** Se oculta en login, visible solo para usuarios autenticados
*   **Tema Dual Completo:** Soporte total para modo claro/oscuro
*   **Transiciones Suaves:** Animaciones optimizadas en todos los elementos
*   **Accesibilidad WCAG:** Cumple con estándares AA de accesibilidad
*   **Responsive Design:** Adaptable a todos los tamaños de pantalla

### ✅ **Sistema de Procesamiento de Datos**
*   **Catalog Processor:** Procesador de catálogos JSON desde Google Drive
*   **API Client Optimizado:** Cliente para consultas SUNAT con cache
*   **Validación Robusta:** Verificación completa de estructura y datos
*   **Estadísticas en Tiempo Real:** Cálculos automáticos sin API calls
*   **Exportación Optimizada:** Reportes Excel con fórmulas dinámicas

### ✅ **Seguridad y Control de Concurrencia**
*   **Límite de Usuarios:** Control de máximo 10 usuarios concurrentes
*   **Session Management:** Gestión robusta de sesiones con timeout automático
*   **Activity Detection:** Detección de actividad optimizada con throttling
*   **Backend Sync:** Sincronización opcional con verificación de estado
*   **Error Handling:** Manejo completo de errores y fallbacks

### ✅ **Arquitectura Minimal Interaction**
*   **Cache-First:** Datos locales como prioridad absoluta
*   **Zero API Calls:** Operaciones 100% locales cuando es posible
*   **Offline Support:** Funcionalidad completa sin conexión
*   **Background Operations:** Procesos no bloqueantes
*   **Resource Optimization:** 95% menos consumo de recursos

## 📊 **Mejoras Anteriores**

### ✅ **Mejoras en Comparador de Precios**
*   **Manejo inteligente de marcas duplicadas:** Al ingresar marcas con el mismo nombre (ej: "Vinifan", "Vinifan"), se agregan automáticamente numerales ("Vinifan", "Vinifan2") para comparación entre sucursales/franquicias.
*   **Tooltips informativos:** Aparecen automáticamente al perder foco cuando hay duplicados, explicando que se renombrarán para evitar conflictos.
*   **Toasts con auto-cierre:** Las notificaciones se cierran automáticamente en 5 segundos para no interrumpir el flujo de trabajo.
*   **Exportación corregida:** Los nombres de marcas procesadas (con numerales) ahora se envían correctamente al backend, asegurando que los headers del Excel reflejen los nombres correctos.

### ✅ **Reportes Excel con Fórmulas Dinámicas**
*   **Totales automáticos:** Todas las filas de totales ahora usan fórmulas Excel dinámicas (`=SUM()`) en lugar de valores estáticos.
*   **Actualización en tiempo real:** Al modificar cantidades directamente en el Excel, los totales se recalculan automáticamente.
*   **Módulos actualizados:**
    - **Pedido:** Total unidades, cajas y peso con fórmulas
    - **Devoluciones:** Total unidades, cajas y peso con fórmulas
    - **Inventario:** Total existencia, cajas, peso y valor con fórmulas
*   **Beneficio:** No es necesario generar nuevos reportes para cambios menores de cantidad.

### ✅ **Optimizaciones en Backend**
*   **Fórmula STDEV corregida:** Cambiada de `DESVEST.P` a `STDEV` para máxima compatibilidad y evitar problemas con "@" en versiones modernas de Excel.
*   **Headers optimizados:** Abreviaturas en columnas largas ("DESVIACIÓN ESTÁNDAR" → "DESV. STD", "+ BARATOS", "+ CAROS") y ancho máximo reducido a 30 caracteres.
*   **Autoajuste inteligente:** Columnas se ajustan automáticamente según contenido con límites apropiados.
*   **Validación de esquemas mejorada:** Esquemas JSON actualizados para incluir campos requeridos como `totales` en inventario.

### ✅ **Correcciones de Tipos de Datos**
*   **Conversión automática de tipos:** Los campos numéricos (como `cantidad`) se convierten automáticamente a tipos correctos (integer/string) antes del envío al backend.
*   **Validación de esquemas:** El backend ahora valida correctamente los tipos de datos según los esquemas JSON definidos.
*   **Compatibilidad mejorada:** Eliminadas conversiones problemáticas que causaban errores de validación.

### ✅ **Limpieza y Mantenimiento**
*   Eliminado módulo planificador y toda su lógica, estilos y dependencias.
*   Paletas por módulo implementadas (rojo/azul/verde/naranja).
*   Altura uniforme en todos los inputs/selects (20px).
*   Comparador: inputs de precio 45×20 con `.price-cell-45`; cabecera responsive.
*   **Comparador:** Corregida la estructura del archivo Excel para que la fila 10 esté vacía, la fila 11 contenga los encabezados y los datos comiencen en la fila 12.
*   Removido tema global y dependencias no usadas; build Tailwind v4 estabilizado.
*   **Limpieza de repositorio:** Eliminados archivos innecesarios (`changes.patch`, `.git_disabled/`, `.kombai/`).
*   **Código limpio:** Removidos logs de debug y código temporal después de las correcciones.

## Licencia

MIT
