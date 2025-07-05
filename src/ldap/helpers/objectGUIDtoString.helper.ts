export function parseObjectGUID(input: string): string | null {
  try {
    const buf = Buffer.from(input, 'binary');
    const hex = buf.toString('hex');
    return [
      hex.substring(6, 8),
      hex.substring(4, 6),
      hex.substring(2, 4),
      hex.substring(0, 2),
      '-',
      hex.substring(10, 12),
      hex.substring(8, 10),
      '-',
      hex.substring(14, 16),
      hex.substring(12, 14),
      '-',
      hex.substring(16, 20),
      '-',
      hex.substring(20),
    ].join('');
  } catch {
    return null;
  }
}
