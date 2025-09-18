import React from 'react';

interface PercentageDisplayProps {
  value: number;
  showSign?: boolean;
  className?: string;
}

export const PercentageDisplay: React.FC<PercentageDisplayProps> = ({
  value,
  showSign = true,
  className = ''
}) => {
  const isPositive = value > 0;
  const isNegative = value < 0;

  // Determinar clases de color basadas en el valor
  const colorClass = isPositive
    ? 'text-red-500' // Rojo para positivos
    : isNegative
    ? 'text-green-500' // Verde para negativos
    : 'text-gray-500'; // Gris para cero

  // Formatear el valor como porcentaje
  const formattedValue = Math.abs(value).toFixed(2);
  const sign = showSign ? (isPositive ? '+' : isNegative ? '-' : '') : '';
  const displayValue = `${sign}${formattedValue}%`;

  return (
    <span
      className={`font-medium ${colorClass} ${className}`}
      title={`${isPositive ? 'Incremento' : isNegative ? 'Decremento' : 'Sin cambio'}: ${formattedValue}%`}
    >
      {displayValue}
    </span>
  );
};

export default PercentageDisplay;