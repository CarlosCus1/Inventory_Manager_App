import React from 'react';
import { formatQuantityDisplay } from '../../stringFormatters';

interface InputQtyProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number | string;
  onValueChange: (v: string) => void; // raw change while typing
  onCommit?: (v: string) => void; // called on blur with formatted value
}

export const InputQty: React.FC<InputQtyProps> = ({ value, onValueChange, onCommit, className = '', ...rest }) => {
  const [display, setDisplay] = React.useState<string>(() => {
    if (value === undefined || value === null || value === '') return '';
    return String(value);
  });
  const [focused, setFocused] = React.useState(false);

  // sync when external value changes and not focused
  React.useEffect(() => {
    if (!focused) {
      if (value === undefined || value === null || value === '') setDisplay('');
      else setDisplay(formatQuantityDisplay(value));
    }
  }, [value, focused]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    // show raw value for editing
    setDisplay(value === undefined || value === null ? '' : String(value));
    if (rest.onFocus) rest.onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    // format for display
    const formatted = display === '' ? '' : formatQuantityDisplay(display);
    setDisplay(formatted);
    if (onCommit) onCommit(formatted);
    if (rest.onBlur) rest.onBlur(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplay(e.target.value);
    onValueChange(e.target.value);
    if (rest.onChange) rest.onChange(e as any);
  };

  return (
    <input
      {...rest}
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`${className}`}
    />
  );
};

export default InputQty;
