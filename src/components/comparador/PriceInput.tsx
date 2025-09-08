import React, { useState, useEffect } from 'react';

interface PriceInputProps {
  initialValue: number | null;
  onPriceChange: (value: number | null) => void;
  competidor: string;
  item: { codigo: string; nombre: string };
}

export const PriceInput: React.FC<PriceInputProps> = ({ initialValue, onPriceChange, competidor, item }) => {
  const [displayValue, setDisplayValue] = useState<string>('');

  useEffect(() => {
    setDisplayValue(initialValue !== null ? initialValue.toFixed(2) : '');
  }, [initialValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
  };

  const handleInputBlur = () => {
    const cleanedValue = displayValue.replace(/[^0-9.]/g, '');
    let numericValue: number | null = null;
    let displayValueForUI: string = displayValue;

    if (cleanedValue !== '') {
      const parsed = parseFloat(cleanedValue);
      if (!isNaN(parsed)) {
        numericValue = parseFloat(parsed.toFixed(2));
        displayValueForUI = numericValue.toFixed(2);
      } else {
        displayValueForUI = cleanedValue;
      }
    } else {
      displayValueForUI = '';
    }

    onPriceChange(numericValue);
    setDisplayValue(displayValueForUI);
  };

  return (
    <input
      type="text"
      aria-label={`Precio de ${item.nombre} en ${competidor}`}
      placeholder="S/. 0.00"
      value={displayValue}
      onChange={handleInputChange}
      onBlur={handleInputBlur}
      className="input input-module-comparador w-16 px-2"
    />
  );
};
