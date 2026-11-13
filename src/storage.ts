/** Browser persistence is optional: blocked storage must not interrupt the app. */
export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function writeStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
export function readSettings(key: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(readStorage(key) ?? "null");
    return value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
export function isCalculationMethod(
  value: unknown,
): value is "average" | "highest" | "lowest" | "weighted" {
  return (
    value === "average" ||
    value === "highest" ||
    value === "lowest" ||
    value === "weighted"
  );
}
export function isPositiveNumber(value: unknown): value is number | string {
  return (
    (typeof value === "number" ||
      (typeof value === "string" && value.trim() !== "")) &&
    Number.isFinite(Number(value)) &&
    Number(value) > 0
  );
}
