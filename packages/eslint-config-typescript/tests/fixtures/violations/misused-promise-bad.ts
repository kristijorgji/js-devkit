export function check(p: Promise<boolean>): string {
  if (p) {
    return 'yes';
  }
  return 'no';
}
