import { useState, useEffect } from 'react';

/**
 * Custom hook that debounces a rapidly changing value (such as search input)
 * to avoid spamming URL history or API requests on every keystroke.
 */
export function useDebounce(value, delay = 220) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
