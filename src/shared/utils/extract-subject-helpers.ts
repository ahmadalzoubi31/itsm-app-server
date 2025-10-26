// src/modules/email/services/subject-helpers.ts
export function extractCaseNumber(subject?: string): string | null {
  if (!subject) return null;
  const m = subject.match(/\bCS-\d{6}\b/);
  return m ? m[0] : null;
}
