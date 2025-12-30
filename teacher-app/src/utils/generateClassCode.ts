/**
 * Generates a random 8-character alphanumeric class code
 * Format: XXXX-XXXX (e.g., AB12-CD34)
 * Uses uppercase letters and numbers for clarity (excludes O, 0, I, 1 to avoid confusion)
 */
export function generateClassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes O, 0, I, 1
  let code = '';

  for (let i = 0; i < 8; i++) {
    if (i === 4) {
      code += '-';
    }
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }

  return code;
}

/**
 * Validates a class code format
 */
export function isValidClassCode(code: string): boolean {
  const pattern = /^[A-Z2-9]{4}-[A-Z2-9]{4}$/;
  return pattern.test(code);
}
