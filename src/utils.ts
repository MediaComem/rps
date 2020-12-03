export function isHttpStatus(value: unknown): value is number {
  return isInteger(value) && value >= 100 && value <= 599;
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function isInteger(value: unknown): value is number {
  return Number.isInteger(value);
}
