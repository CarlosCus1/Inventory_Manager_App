import React from 'react';
import type { IProducto } from '../interfaces';
// Define las props que el componente ProductCard aceptará.
interface ProductCardProps {
  product: IProducto;
  onViewDetails?: (codigo: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product,
  onViewDetails 
}) => {
  const { nombre, linea, codigo, stock_referencial } = product;
  const isOutOfStock = stock_referencial === 0;

  const handleButtonClick = () => {
    if (onViewDetails) {
      onViewDetails(codigo);
    }
  };

  return (
    // Usamos <article> para mejor semántica y `group` para efectos en hover.
    <article className="relative flex flex-col md:flex-row card overflow-hidden my-4 max-w-2xl mx-auto transition-shadow duration-300 hover:shadow-2xl group">
      
      {/* Sección de la Imagen */}
      <div className="md:w-1/3 overflow-hidden">
        <img 
          className="w-full h-48 md:h-full object-cover transition-transform duration-300 group-hover:scale-105" 
          // TODO: Reemplazar con la URL de la imagen real del producto
          src={`https://via.placeholder.com/400x400.png/007bff/ffffff?text=${encodeURIComponent(nombre)}`} 
          alt={`Imagen de ${nombre}`} 
        />
      </div>

      {/* Sección del Contenido */}
      <div className="p-6 flex flex-col justify-between md:w-2/3">
        <div>
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium uppercase tracking-wide">{linea}</p>
            {isOutOfStock && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: 'color-mix(in oklab, rgb(239 68 68) 20%, var(--panel) 80%)',
                      color: 'rgb(239 68 68)'
                    }}>
                Agotado
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold mt-1">{nombre}</h2>
          <p className="mt-2"><span className="font-semibold">Código:</span> {codigo}</p>
          <p className={`${isOutOfStock ? '' : ''}`}>
            <span className="font-semibold">Stock:</span> {stock_referencial} unidades
          </p>
        </div>
        
        <div className="mt-6">
          <button 
            onClick={handleButtonClick}
            disabled={isOutOfStock}
            aria-label={`Ver detalles del producto ${nombre}`}
            className="w-full btn"
          >
            Ver Detalles
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
