/**
 * Calorie & BMI maths for /kalkulator. Mifflin-St Jeor for the resting
 * burn, activity factors keyed to training days (the classic 1.55 for
 * "3–4 workouts" overshoots for desk workers who train), ~7700 kcal per kg
 * of body fat. Deficits and surpluses are capped in kcal so big people do
 * not get extreme numbers, and protein is counted on a healthy reference
 * weight, not on body fat. Everything is an estimate, and the page says so.
 */

export type Sex = "f" | "m";
export type Goal = "lose" | "lose_slow" | "keep" | "gain";

export const ACTIVITY = [
  { id: 1.2, label: "Почти не се движа", hint: "работа на бюро, без тренировки" },
  { id: 1.375, label: "Леко движение", hint: "разходки или 1–2 тренировки седмично" },
  { id: 1.465, label: "Умерено", hint: "3–4 тренировки седмично" },
  { id: 1.6, label: "Много", hint: "5–6 тренировки седмично" },
  { id: 1.8, label: "Изключително много", hint: "тежък физически труд или 2 тренировки на ден" },
] as const;

/** factor = share of maintenance; cap = the most kcal it may move the day. */
export const GOALS: { id: Goal; label: string; factor: number; cap: number }[] = [
  { id: "lose", label: "Да отслабна", factor: -0.2, cap: 750 },
  { id: "lose_slow", label: "Да отслабна бавно", factor: -0.1, cap: 400 },
  { id: "keep", label: "Да задържа теглото", factor: 0, cap: 0 },
  { id: "gain", label: "Да кача мускули", factor: 0.1, cap: 300 },
];

/** Snap an old saved activity value (e.g. 1.55) to the nearest current option. */
export function nearestActivity(v: number): number {
  return ACTIVITY.reduce((a, b) => (Math.abs(b.id - v) < Math.abs(a.id - v) ? b : a)).id;
}

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
  /** Muscle gain asked at BMI 27+: counted at maintenance (recomposition). */
  recomp: boolean;
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

  // No weight-loss target for someone already under a healthy weight, and
  // no surplus for someone carrying a lot of fat: building muscle at
  // maintenance (recomposition) is the better plan there.
  const recomp = i.goal === "gain" && bmi >= 27;
  const goal = tone === "low" && i.goal.startsWith("lose") ? "keep" : recomp ? "keep" : i.goal;
  const g = GOALS.find((x) => x.id === goal)!;
  const delta = Math.sign(g.factor) * Math.min(Math.abs(tdee * g.factor), g.cap);
  const floor = i.sex === "m" ? 1500 : 1200;
  let target = tdee + delta;
  const floored = delta < 0 && target < floor;
  if (floored) target = floor;
  target = round(target, 50);

  // Protein per kg of a healthy reference weight (at most the weight for
  // BMI 25), so body fat does not inflate it: 1.2–1.6 g/kg without
  // training, 1.4–1.8 with light movement, 1.6–2.0 when training 3+ times,
  // 1.8–2.2 in a deficit with training (keeps the muscle).
  const refKg = Math.min(i.weightKg, 25 * m * m);
  const [lo, hi] =
    i.activity <= 1.2 ? [1.2, 1.6] : i.activity < 1.45 ? [1.4, 1.8] : goal.startsWith("lose") ? [1.8, 2.2] : [1.6, 2.0];
  const proteinMin = round(refKg * lo, 5);
  const proteinMax = round(refKg * hi, 5);

  const raw = ((target - tdee) * 7) / 7700;
  const perWeek = Math.abs(raw) < 0.05 ? 0 : raw; // rounding to 50 kcal is not a pace
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
    recomp,
    proteinMin,
    proteinMax,
    perWeek: Math.round(perWeek * 100) / 100,
    weeksToTarget,
    healthyMin: Math.round(18.5 * m * m),
    healthyMax: Math.round(24.9 * m * m),
  };
}
