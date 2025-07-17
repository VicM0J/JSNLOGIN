
import { useState, useCallback } from 'react';

export function useUppercase(initialValue: string = '') {
  const [value, setValue] = useState(initialValue.toUpperCase());

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const upperValue = e.target.value.toUpperCase();
    setValue(upperValue);
    
    // Mantener la posición del cursor
    const cursorPosition = e.target.selectionStart;
    setTimeout(() => {
      e.target.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  }, []);

  const setUppercaseValue = useCallback((newValue: string) => {
    setValue(newValue.toUpperCase());
  }, []);

  return {
    value,
    onChange: handleChange,
    setValue: setUppercaseValue
  };
}
