// --------------------------------------------------------------------------- #
//                                                                             #
//           src/components/form-fields/DevolucionesPedidoFields.tsx           #
//                                                                             #
// --------------------------------------------------------------------------- #

import React from 'react';
import type { IForm } from '../../interfaces';

interface Props {
  formState: IForm;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  variant: 'devoluciones' | 'pedido';
}

export const DevolucionesPedidoFields: React.FC<Props> = () => (
  <></>
);