// --------------------------------------------------------------------------- #
//                                                                             #
//           src/components/form-fields/DevolucionesPedidoFields.tsx           #
//                                                                             #
// --------------------------------------------------------------------------- #

import React from 'react';
import type { IForm } from '.././interfaces';

interface Props {
  formState: IForm;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  baseInputClass: string;
  errorDocumento: string | null;
}

export const DevolucionesPedidoFields: React.FC<Props> = () => (
  <></>
);