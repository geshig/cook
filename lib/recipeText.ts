/**
 * Ingredients are stored as one "; "-separated line, steps as "\n"-separated
 * lines with a leading "1. " number. Both directions (display splitting,
 * admin-form joining) live here so the two stay in sync.
 */

export function parseIngredients(text: string | null): string[] {
  return (text ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatIngredients(lines: string[]): string {
  return lines
    .map((s) => s.trim())
    .filter(Boolean)
    .join("; ");
}

export function parseSteps(text: string | null): string[] {
  return (text ?? "")
    .split("\n")
    .map((s) => s.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

export function formatSteps(lines: string[]): string {
  return lines
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s, i) => `${i + 1}. ${s}`)
    .join("\n");
}
