/** Shared validation helpers for authentication forms. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPassword(value: string): boolean {
  return value.length >= 8;
}

/** Hides most of the local part of an email for on-screen confirmation. */
export function maskEmail(value: string): string {
  const trimmed = value.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0) return trimmed;
  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(local.length - visible.length, 1))}${domain}`;
}
