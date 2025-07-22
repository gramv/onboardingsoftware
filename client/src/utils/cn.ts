// Simple className utility to replace clsx until dependencies are installed
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}