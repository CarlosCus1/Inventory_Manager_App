/**
 * Procesador y validador de catálogo JSON
 *
 * ✅ FUNCIONALIDADES:
 * - Descarga y parsing de archivos JSON
 * - Validación de estructura de datos
 * - Detección de errores y inconsistencias
 * - Formateo y normalización de datos
 * - Estadísticas del catálogo
 */

export interface CatalogProduct {
  codigo: string;
  nombre: string;
  ean: string;
  ean_14: string;
  u_por_caja: number;
  stock_referencial: number;
  linea: string;
  keywords: string;
  precio: number;
  can_kg_um: number;
}

export interface CatalogValidationResult {
  isValid: boolean;
  totalProducts: number;
  validProducts: number;
  errors: string[];
  warnings: string[];
  statistics: {
    uniqueCodes: number;
    uniqueNames: number;
    priceRange: { min: number; max: number; avg: number };
    categories: Record<string, number>;
    totalValue: number;
  };
}

export class CatalogProcessor {
  private static instance: CatalogProcessor;

  static getInstance(): CatalogProcessor {
    if (!CatalogProcessor.instance) {
      CatalogProcessor.instance = new CatalogProcessor();
    }
    return CatalogProcessor.instance;
  }

  /**
   * Download and parse catalog from Google Drive URL
   */
  async downloadCatalog(url: string): Promise<CatalogProduct[]> {
    try {
      console.log('📥 Descargando catálogo desde:', url);

      const response = await fetch(`https://drive.google.com/uc?export=download&id=${this.extractFileId(url)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }

      const rawText = await response.text();
      console.log('📄 Contenido crudo recibido, longitud:', rawText.length);

      // Clean the raw text (remove BOM and normalize)
      const cleanText = rawText.trim();

      if (!cleanText) {
        throw new Error('El archivo está vacío o no contiene datos válidos');
      }

      // Try to parse as JSON array
      let data: unknown[];
      try {
        data = JSON.parse(cleanText);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        throw new Error('El archivo no contiene JSON válido');
      }

      if (!Array.isArray(data)) {
        throw new Error('El archivo JSON debe ser un array de productos');
      }

      console.log('✅ Catálogo descargado exitosamente:', data.length, 'productos');
      return data as CatalogProduct[];

    } catch (error) {
      console.error('❌ Error descargando catálogo:', error);
      throw error;
    }
  }

  /**
   * Validate catalog structure and data integrity
   */
  validateCatalog(products: CatalogProduct[]): CatalogValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const validProducts: CatalogProduct[] = [];

    // Statistics tracking
    const codes = new Set<string>();
    const names = new Set<string>();
    const prices: number[] = [];
    const categories: Record<string, number> = {};
    let totalValue = 0;

    console.log('🔍 Validando catálogo:', products.length, 'productos');

    products.forEach((product, index) => {
      const productErrors: string[] = [];
      const productWarnings: string[] = [];

      // Required fields validation
      if (!product.codigo || typeof product.codigo !== 'string') {
        productErrors.push(`Producto ${index + 1}: código es requerido`);
      }

      if (!product.nombre || typeof product.nombre !== 'string') {
        productErrors.push(`Producto ${index + 1}: nombre es requerido`);
      }

      if (product.precio === undefined || product.precio === null || typeof product.precio !== 'number') {
        productErrors.push(`Producto ${index + 1}: precio debe ser un número válido`);
      }

      // Data type validation
      if (product.u_por_caja && typeof product.u_por_caja !== 'number') {
        productErrors.push(`Producto ${index + 1}: u_por_caja debe ser un número`);
      }

      if (product.stock_referencial && typeof product.stock_referencial !== 'number') {
        productErrors.push(`Producto ${index + 1}: stock_referencial debe ser un número`);
      }

      // Business logic validation
      if (product.precio && product.precio < 0) {
        productErrors.push(`Producto ${index + 1}: precio no puede ser negativo`);
      }

      if (product.stock_referencial && product.stock_referencial < 0) {
        productErrors.push(`Producto ${index + 1}: stock_referencial no puede ser negativo`);
      }

      // Warnings (non-critical issues)
      if (product.codigo && product.codigo.length < 3) {
        productWarnings.push(`Producto ${index + 1}: código muy corto`);
      }

      if (product.nombre && product.nombre.length < 5) {
        productWarnings.push(`Producto ${index + 1}: nombre muy corto`);
      }

      if (product.precio && product.precio > 1000) {
        productWarnings.push(`Producto ${index + 1}: precio muy alto (>1000)`);
      }

      // Collect statistics
      if (productErrors.length === 0) {
        validProducts.push(product);
        codes.add(product.codigo);

        if (product.nombre) {
          names.add(product.nombre);
        }

        if (product.precio && product.precio > 0) {
          prices.push(product.precio);
          totalValue += product.precio * (product.stock_referencial || 0);
        }

        if (product.linea) {
          categories[product.linea] = (categories[product.linea] || 0) + 1;
        }
      }

      errors.push(...productErrors);
      warnings.push(...productWarnings);
    });

    // Calculate statistics
    const statistics = {
      uniqueCodes: codes.size,
      uniqueNames: names.size,
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0,
        avg: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
      },
      categories,
      totalValue
    };

    const result: CatalogValidationResult = {
      isValid: errors.length === 0,
      totalProducts: products.length,
      validProducts: validProducts.length,
      errors,
      warnings,
      statistics
    };

    console.log('📊 Resultados de validación:', {
      total: result.totalProducts,
      validos: result.validProducts,
      errores: result.errors.length,
      warnings: result.warnings.length
    });

    return result;
  }

  /**
   * Extract file ID from Google Drive URL
   */
  private extractFileId(url: string): string {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      throw new Error('URL de Google Drive inválida. Debe tener formato: /file/d/FILE_ID');
    }
    return match[1];
  }

  /**
   * Process and normalize catalog data
   */
  normalizeCatalog(products: CatalogProduct[]): CatalogProduct[] {
    return products.map(product => ({
      ...product,
      // Normalize text fields
      nombre: product.nombre?.trim() || '',
      linea: product.linea?.trim() || '',
      keywords: product.keywords?.trim() || '',

      // Ensure numeric fields
      u_por_caja: Number(product.u_por_caja) || 1,
      stock_referencial: Number(product.stock_referencial) || 0,
      precio: Number(product.precio) || 0,
      can_kg_um: Number(product.can_kg_um) || 0,

      // Normalize codes
      codigo: product.codigo?.trim() || '',
      ean: product.ean?.trim() || '',
      ean_14: product.ean_14?.trim() || ''
    }));
  }

  /**
   * Generate catalog summary report
   */
  generateReport(validation: CatalogValidationResult): string {
    const report = [
      '📊 REPORTE DE VALIDACIÓN DE CATÁLOGO',
      '='.repeat(50),
      '',
      '📈 ESTADÍSTICAS GENERALES:',
      `• Total de productos: ${validation.totalProducts}`,
      `• Productos válidos: ${validation.validProducts}`,
      `• Tasa de éxito: ${((validation.validProducts / validation.totalProducts) * 100).toFixed(1)}%`,
      '',
      '💰 ANÁLISIS FINANCIERO:',
      `• Rango de precios: $${validation.statistics.priceRange.min.toFixed(2)} - $${validation.statistics.priceRange.max.toFixed(2)}`,
      `• Precio promedio: $${validation.statistics.priceRange.avg.toFixed(2)}`,
      `• Valor total del inventario: $${validation.statistics.totalValue.toFixed(2)}`,
      '',
      '🏷️ CATEGORÍAS:',
      ...Object.entries(validation.statistics.categories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([category, count]) => `• ${category}: ${count} productos`),
      '',
      '⚠️ ADVERTENCIAS:',
      ...(validation.warnings.length > 0
        ? validation.warnings.slice(0, 10).map(w => `• ${w}`)
        : ['• No hay advertencias']),
      '',
      '❌ ERRORES:',
      ...(validation.errors.length > 0
        ? validation.errors.slice(0, 10).map(e => `• ${e}`)
        : ['• No hay errores']),
      '',
      '🎯 ESTADO FINAL:',
      validation.isValid
        ? '✅ Catálogo válido y listo para usar'
        : '❌ Catálogo con errores que requieren atención'
    ];

    return report.join('\n');
  }
}

// Export singleton instance
export const catalogProcessor = CatalogProcessor.getInstance();