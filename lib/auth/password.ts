/**
 * Constant-time string comparison. Returns false immediately for length
 * mismatch (length itself is not secret in our context).
 */
export function verifyPassword(input: string, expected: string): boolean {
  if (!input || !expected) return false;
  if (input.length !== expected.length) return false;

  let result = 0;
  for (let i = 0; i < input.length; i++) {
    result |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return result === 0;
}
