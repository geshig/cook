/**
 * Онлайн коучинг с Геша: цени, места и полетата на формата.
 * Без "server-only": формата (клиентски компонент) ползва същите списъци.
 */
export const COACHING = {
  spots: 10,
  start: "1 декември",
  month: 9700, // 97 € на месец, абонамент
  three: 23700, // 237 € за 3 месеца, еднократно
  product: "Онлайн коучинг с Геша",
};

export type CoachingPlan = "month" | "three";

export const GOALS = ["Да сваля килограми", "Да стегна тялото", "Да кача мускули", "Да се храня по-здравословно"];

export const ACTIVITY = [
  "Седя почти целия ден",
  "Малко движение (разходки)",
  "Тренирам 1–2 пъти седмично",
  "Тренирам 3–4 пъти седмично",
  "Работа на крак / тренирам 5+ пъти",
];

export const TRAIN_WHERE = ["Вкъщи без уреди", "Вкъщи с дъмбели/ластици", "Във фитнес", "Само хранене, без тренировки"];

export const CONTACT_APPS = ["Viber", "WhatsApp", "Telegram", "Обаждане"];

/** Отметнато някое от тези: преди старт питам дали лекар е съгласен. */
export const HEALTH = [
  "Бременна съм или кърмя",
  "Диабет",
  "Щитовидна жлеза",
  "Високо кръвно / сърце",
  "Болки в кръста или ставите",
  "Хранително разстройство (сега или преди)",
  "Пия лекарства постоянно",
];

/** Тези искат изрично „да“ от лекар, преди да започнем. */
export const HEALTH_DOCTOR = new Set([HEALTH[0], HEALTH[1], HEALTH[3], HEALTH[5]]);

export type CoachingApp = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  contact_app: string | null;
  goal: string | null;
  sex: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity: string | null;
  train_where: string | null;
  train_days: number | null;
  dislikes: string | null;
  tried: string | null;
  health: string[] | null;
  health_note: string | null;
  plan: string | null;
  status: "new" | "approved" | "rejected" | "paid" | "ended";
  pay_token: string | null;
  paid_plan: string | null;
  paid_at: string | null;
};
