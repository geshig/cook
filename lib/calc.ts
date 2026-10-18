/**
 * Calorie & BMI maths for /kalkulator. Mifflin-St Jeor for the resting
 * burn, standard activity factors, ~7700 kcal per kg of body fat.
 * Everything is an estimate, and the page says so.
 */

export type Sex = "f" | "m";
export type Goal = "lose" | "lose_slow" | "keep" | "gain";

export const ACTIVITY = [
  { id: 1.2, label: "Почти не се движа", hint: "работа на бюро, без тренировки" },
  { id: 1.375, label: "Леко движение", hint: "разходки или 1–2 тренировки седмично" },
  { id: 1.55, label: "Умерено", hint: "3–4 тренировки седмично" },
  { id: 1.725, label: "Много", hint: "5–6 тренировки седмично" },
  { id: 1.9, label: "Изключително много", hint: "тежък физически труд или 2 тренировки на ден" },
] as const;

export const GOALS: { id: Goal; label: string; factor: number }[] = [
  { id: "lose", label: "Да отслабна", factor: -0.2 },
  { id: "lose_slow", label: "Да отслабна бавно", factor: -0.1 },
  { id: "keep", label: "Да задържа теглото", factor: 0 },
  { id: "gain", label: "Да кача мускули", factor: 0.1 },
];

export type CalcInput = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: number;
  goal: Goal;
  targetKg?: number | null;
};

export type CalcResult = {
  bmi: number;
  bmiLabel: string;
  bmiTone: "low" | "ok" | "high" | "veryhigh";
  bmr: number;
  tdee: number;
  target: number;
  /** True when the floor (1200/1500) raised the number. */
  floored: boolean;
  proteinMin: number;
  proteinMax: number;
  /** kg per week, negative = losing. */
  perWeek: number;
  weeksToTarget: number | null;
  healthyMin: number;
  healthyMax: number;
};

const round = (n: number, step = 1) => Math.round(n / step) * step;

export function bmiInfo(bmi: number): { label: string; tone: CalcResult["bmiTone"] } {
  if (bmi < 18.5) return { label: "Под нормалното", tone: "low" };
  if (bmi < 25) return { label: "Нормално тегло", tone: "ok" };
  if (bmi < 30) return { label: "Наднормено тегло", tone: "high" };
  return { label: "Затлъстяване", tone: "veryhigh" };
}

export function calculate(i: CalcInput): CalcResult {
  const m = i.heightCm / 100;
  const bmi = i.weightKg / (m * m);
  const { label, tone } = bmiInfo(bmi);
  const bmr = 10 * i.weightKg + 6.25 * i.heightCm - 5 * i.age + (i.sex === "m" ? 5 : -161);
  const tdee = bmr * i.activity;

  // No weight-loss target for someone already under a healthy weight.
  const goal = tone === "low" && i.goal.startsWith("lose") ? "keep" : i.goal;
  const factor = GOALS.find((g) => g.id === goal)!.factor;
  const floor = i.sex === "m" ? 1500 : 1200;
  let target = tdee * (1 + factor);
  const floored = factor < 0 && target < floor;
  if (floored) target = floor;
  target = round(target, 50);

  // At least 2 g per kg of body weight (capped at the weight for BMI 30,
  // so it stays sensible at a very high weight).
  const refKg = Math.min(i.weightKg, 30 * m * m);
  const proteinMin = round(refKg * 2.0, 5);
  const proteinMax = round(refKg * 2.2, 5);

  const perWeek = ((target - tdee) * 7) / 7700;
  let weeksToTarget: number | null = null;
  if (i.targetKg && Math.abs(perWeek) > 0.05) {
    const diff = i.targetKg - i.weightKg;
    if (Math.sign(diff) === Math.sign(perWeek)) weeksToTarget = Math.ceil(diff / perWeek);
  }

  return {
    bmi: Math.round(bmi * 10) / 10,
    bmiLabel: label,
    bmiTone: tone,
    bmr: round(bmr, 10),
    tdee: round(tdee, 50),
    target,
    floored,
    proteinMin,
    proteinMax,
    perWeek: Math.round(perWeek * 100) / 100,
    weeksToTarget,
    healthyMin: Math.round(18.5 * m * m),
    healthyMax: Math.round(24.9 * m * m),
  };
}
