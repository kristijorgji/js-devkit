type Mode = 'a' | 'b';

export function label(mode: Mode): string {
  switch (mode) {
    case 'a':
      return 'A';
  }
  return '';
}
