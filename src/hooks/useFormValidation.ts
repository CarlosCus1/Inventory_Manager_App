import { useCallback } from 'react';
import type { ValidationRule } from '../interfaces';

type ValidationResult = {
  isValid: boolean;
  errorMessage: string | null;
};

export const useFormValidation = () => {
  const validate = useCallback((value: string, rules: ValidationRule[]): ValidationResult => {
    for (const rule of rules) {
      if (rule.type === 'required' && !value) {
        return { isValid: false, errorMessage: rule.message };
      }
      if (rule.type === 'isNumeric' && isNaN(Number(value))) {
        return { isValid: false, errorMessage: rule.message };
      }
      if (rule.type === 'minLength' && rule.value && value.length < rule.value) {
        return { isValid: false, errorMessage: rule.message };
      }
      if (rule.type === 'maxLength' && rule.value && value.length > rule.value) {
        return { isValid: false, errorMessage: rule.message };
      }
      if (rule.type === 'isDni' && !/^\d{8}$/.test(value)) {
        return { isValid: false, errorMessage: rule.message };
      }
      if (rule.type === 'isRuc' && !/^\d{11}$/.test(value)) {
        return { isValid: false, errorMessage: rule.message };
      }
      if (rule.type === 'isValidDate') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return { isValid: false, errorMessage: rule.message };
        }
      }
    }
    return { isValid: true, errorMessage: null };
  }, []);

  return { validate };
};
