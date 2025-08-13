import React from "react";
import type { IForm } from "../../interfaces";

interface Props {
    formState: IForm;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    baseInputClass: string;
    errorDocumento: string | null;
}

export const InventarioFields: React.FC<Props> = () => {
  // Campo 'Cantidad en stock' retirado según requerimiento
  return <div className="space-y-4" />;
};
