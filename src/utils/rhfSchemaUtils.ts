import { RegisterOptions } from 'react-hook-form';

interface SchemaProperty {
  type?: string;
  minimum?: number;
  exclusiveMinimum?: number;
  maximum?: number;
  exclusiveMaximum?: number;
  // Assuming 'required' might be part of a parent schema or inferred
  // For now, we'll handle it if explicitly passed or part of a larger schema object
  errorMessage?: string; // Or a map of error messages
}

export const getRulesFromSchema = (schema: SchemaProperty, isRequired: boolean = false): RegisterOptions => {
  const rules: RegisterOptions = {};

  if (isRequired) {
    rules.required = schema.errorMessage || 'Este campo es requerido';
  }

  if (schema.minimum !== undefined) {
    rules.min = {
      value: schema.minimum,
      message: schema.errorMessage || `El valor debe ser al menos ${schema.minimum}`
    };
  }

  if (schema.exclusiveMinimum !== undefined) {
    const exclusiveMin = schema.exclusiveMinimum;
    rules.validate = (value: unknown) => {
      const numericValue = Number(value);
      if (value === null || value === undefined || isNaN(numericValue)) return schema.errorMessage || `El valor debe ser mayor que ${exclusiveMin}`;
      return numericValue > exclusiveMin || (schema.errorMessage || `El valor debe ser mayor que ${exclusiveMin}`);
    };
  }

  if (schema.maximum !== undefined) {
    rules.max = {
      value: schema.maximum,
      message: schema.errorMessage || `El valor no debe exceder ${schema.maximum}`
    };
  }

  // Add more validation rules based on schema properties as needed (e.g., pattern, maxLength, etc.)

  return rules;
};
