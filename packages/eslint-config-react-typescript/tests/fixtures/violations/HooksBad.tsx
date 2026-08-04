import { useState } from 'react';

export function Counter(): null {
  const [n, setN] = useState(0);
  if (n > 0) {
    useState(1);
  }
  setN(n);
  return null;
}
