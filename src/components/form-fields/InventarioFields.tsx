import React from "react";
import type { IForm } from "../../interfaces";

interface Props {
    formState: IForm;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    variant: 'inventario';
}

export const InventarioFields: React.FC<Props> = () => {
  // Campo 'Cantidad en stock' retirado según requerimiento
  return <div className="space-y-4" />;
};
