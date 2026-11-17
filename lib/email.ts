import "server-only";
import { COMMUNITY, getSiteUrl } from "./site";
import { COACHING } from "./coaching";
import { createAdminClient } from "./supabase/admin";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const bgDate = (iso: string | number) =>
  new Date(iso).toLocaleDateString("bg-BG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Sofia",
  });

/**
 * Sends one email through Resend's HTTP API. Needs RESEND_API_KEY in Vercel;
 * without it, logs and returns false so nothing else breaks.
 */
async function send(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.warn("RESEND_API_KEY липсва, имейлът не е изпратен:", opts.subject);
    return false;
  }
  const from = process.env.EMAIL_FROM?.trim() || "Геша <hello@geshapov.com>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Idempotency-Key": opts.idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      reply_to: "hello@geshapov.com",
      // Mail apps show an "Unsubscribe" link for non-transactional emails; it
      // also tells Gmail these are wanted emails from a real sender (less spam).
      ...(/^(purchase|gift|test|coach)-/.test(opts.idempotencyKey)
        ? {}
        : { headers: { "List-Unsubscribe": "<mailto:hello@geshapov.com?subject=stop>" } }),
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });
  const ok = res.ok;
  if (!ok) console.error("Resend error", res.status, await res.text().catch(() => ""));
  await logEmail(opts.to, opts.subject, opts.idempotencyKey, ok);
  return ok;
}

/**
 * Admin → Имейли: a record of every email the site sends. Best effort: if the
 * email_log table is missing, the email still goes out.
 */
async function logEmail(to: string, subject: string, key: string, ok: boolean) {
  try {
    const kind = key.split("-")[0];
    await createAdminClient().from("email_log").insert({ to_email: to.toLowerCase(), subject, kind, ok });
  } catch {}
}

/** Admin → Имейли: a test to hello@, which proves sending and forwarding work. */
export async function sendTestEmail(to: string): Promise<boolean> {
  const when = new Date().toLocaleString("bg-BG", { timeZone: "Europe/Sofia" });
  const lines = [
    "Това е тестов имейл от сайта.",
    `Изпратен е през Resend на ${when} до ${to}.`,
    "Ако го виждаш в geshbdo@gmail.com, значи и изпращането, и препращането от hello@geshapov.com работят.",
  ];
  return send({
    to,
    subject: `Тест от сайта, ${when}`,
    html: wrap(lines.map((l) => `<p>${esc(l)}</p>`).join("")),
    text: lines.join("\n\n"),
    idempotencyKey: `test-${Date.now()}`,
  });
}

/**
 * Sent right after the book is paid: how to log in, the bonus, and a written
 * confirmation of what was bought and agreed to (a "durable medium" copy).
 */
export async function sendPurchaseEmail(opts: {
  email: string;
  paidAt: number; // unix seconds
  amount: string; // "47,00 €"
  /** Free months of new recipes the buyer can claim (3 for the first 100). */
  bonusMonths: 3 | 1;
  sessionId: string;
  giftCodes?: string[];
}): Promise<boolean> {
  const site = getSiteUrl();
  const giftLinks = (opts.giftCodes ?? []).map((c) => `${site}/podarak/${c}`);
  const login = `${site}/login?email=${encodeURIComponent(opts.email)}`;
  const paid = bgDate(opts.paidAt * 1000);
  const months = opts.bonusMonths === 3 ? "3 месеца" : "1 месец";
  const claim = `${site}/recipes#bonus`;

  const group = COMMUNITY.url;
  const text = [
    "Здравей! 👋",
    "",
    "Аз съм Геша и искрено ти благодаря, че взе книгата ми. Това значи много за мен и за Хоуми, който опитва всичко пръв 🐾",
    "",
    "Всичките 100+ рецепти вече са отключени за теб.",
    `Влез в книгата: ${login}`,
    "",
    "КАК ВЛИЗАШ",
    `Влизаш с този имейл: ${opts.email}. Пращам ти линк за вход, без парола, и сайтът те помни на телефона.`,
    "",
    "КАК РАБОТИ КНИГАТА",
    `Кратко видео и стъпки: порциите, режим „Готвя“, списъкът, менюто по калории и калкулаторът: ${site}/kak-raboti`,
    "",
    ...(group
      ? [
          "ЕЛА В ЗАТВОРЕНАТА НИ ГРУПА ВЪВ FACEBOOK",
          "Направих затворена група във Facebook само за хората с книгата. Там си показваме какво сме сготвили, питаме се за замени и първо там пускам новите неща. Пускам и полезни неща от мен за здраве и тренировки. А ако някой ден поискаш да тренираме заедно, там ще разбереш как. Ще се радвам да те видя вътре!",
          `Влез в групата: ${group}`,
          "",
        ]
      : []),
    `ТВОЯТ БОНУС: ${months.toUpperCase()} НОВИ РЕЦЕПТИ БЕЗПЛАТНО`,
    `Всеки месец добавям 3–4 нови рецепти. С книгата имаш ${months} достъп до тях безплатно. Вземи ги с едно натискане: ${claim}`,
    "След безплатния период е 5,99 € на месец, само ако не спреш абонамента. Спираш го по всяко време от „Профил“.",
    "7 дни преди първото плащане ще ти пратя напомняне. А ако все пак забравиш да го спреш, пиши ми и ти връщам парите. Не е проблем.",
    "",
    ...(giftLinks.length
      ? ["ЛИНК ЗА ВТОРИЯ ЧОВЕК", "Прати този линк на човека, с когото купихте книгата. Той влиза със своя имейл:", ...giftLinks, ""]
      : []),
    "СЪВЕТ: На телефона добави сайта на началния екран и се отваря като приложение.",
    "",
    "Ако нещо не ти е ясно или не работи, просто отговори на този имейл. Чета и отговарям сам на всеки.",
    "",
    "Приятно готвене!",
    "Геша и Хоуми 🐾",
    "",
    "---",
    "ЗА ПОКУПКАТА",
    `Купи: онлайн достъп до рецептите в книгата „Кухнята на Геша“ на ${site.replace(/^https?:\/\//, "")}, ${opts.amount} еднократно, на ${paid.replace(/\.$/, "")}.`,
    "При плащането се съгласи с Условията за ползване и поиска достъпът да започне веднага. Затова правото на отказ в 14 дни не важи за книгата.",
    `Условията: ${site}/usloviya`,
  ].join("\n");

  const p = (s: string) => `<p style="margin:0 0 14px;line-height:1.6">${s}</p>`;
  const h = (s: string) =>
    `<p style="margin:24px 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;color:#6b7f3a">${s}</p>`;
  const btn = (href: string, label: string) =>
    `<p style="margin:4px 0 16px"><a href="${esc(href)}" style="display:inline-block;padding:12px 22px;background:#6b7f3a;color:#fff;border-radius:100px;text-decoration:none;font-weight:bold">${label}</a></p>`;
  const html = `<!doctype html><html lang="bg"><body style="margin:0;background:#ffffff">
<div style="max-width:560px;margin:0 auto;padding:28px 22px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;color:#2b2a26">
${header(site)}
${p("Здравей! 👋")}
${p("Аз съм Геша и искрено ти благодаря, че взе книгата ми. Това значи много за мен и за Хоуми, който опитва всичко пръв 🐾")}
${p("Всичките <b>100+ рецепти</b> вече са отключени за теб.")}
${btn(login, "Влез в книгата")}
${h("КАК ВЛИЗАШ")}
${p(`Влизаш с този имейл: <b>${esc(opts.email)}</b>. Пращам ти линк за вход, без парола, и сайтът те помни на телефона.`)}
${h("КАК РАБОТИ КНИГАТА")}
${p(`Кратко видео и стъпки: порциите, режим „Готвя“, списъкът, менюто по калории и калкулаторът. <a href="${site}/kak-raboti" style="color:#6b7f3a;font-weight:700">Виж как работи</a>.`)}
${
  group
    ? h("ЕЛА В ЗАТВОРЕНАТА НИ ГРУПА ВЪВ FACEBOOK") +
      p("Направих затворена група във Facebook само за хората с книгата. Там си показваме какво сме сготвили, питаме се за замени и първо там пускам новите неща. Пускам и полезни неща от мен за здраве и тренировки. А ако някой ден поискаш да тренираме заедно, там ще разбереш как. Ще се радвам да те видя вътре!") +
      btn(group, "Влез в групата")
    : ""
}
${h(`ТВОЯТ БОНУС: ${months.toUpperCase()} НОВИ РЕЦЕПТИ БЕЗПЛАТНО`)}
${p(`Всеки месец добавям 3–4 нови рецепти. С книгата имаш ${months} достъп до тях безплатно. Вземаш го с едно натискане тук: <a href="${esc(claim)}" style="color:#6b7f3a;font-weight:700">вземи бонуса</a>.`)}
${p("След безплатния период е 5,99 € на месец, само ако не спреш абонамента. Спираш го по всяко време от „Профил“.")}
${p("7 дни преди първото плащане ще ти пратя напомняне. А ако все пак забравиш да го спреш, пиши ми и ти връщам парите. Не е проблем.")}
${
  giftLinks.length
    ? h("ЛИНК ЗА ВТОРИЯ ЧОВЕК") +
      p("Прати този линк на човека, с когото купихте книгата. Той влиза със своя имейл:") +
      giftLinks.map((l) => `<p style="margin:0 0 14px"><a href="${esc(l)}" style="color:#6b7f3a;font-weight:700">${esc(l.replace(/^https?:\/\//, ""))}</a></p>`).join("")
    : ""
}
${h("СЪВЕТ")}
${p("На телефона добави сайта на началния екран и се отваря като приложение.")}
${p("Ако нещо не ти е ясно или не работи, просто отговори на този имейл. Чета и отговарям сам на всеки.")}
${p("Приятно готвене!<br>Геша и Хоуми 🐾")}
<div style="margin-top:26px;padding-top:16px;border-top:1px solid #e8e5dc;font-size:13px;color:#5e5a4f;line-height:1.55">
<b style="color:#2b2a26">За покупката.</b> Купи: онлайн достъп до рецептите в книгата „Кухнята на Геша“, ${esc(opts.amount)} еднократно, на ${esc(paid.replace(/\.$/, ""))}. При плащането се съгласи с <a href="${site}/usloviya" style="color:#6b7f3a">Условията за ползване</a> и поиска достъпът да започне веднага. Затова правото на отказ в 14 дни не важи за книгата.
</div>
</div></body></html>`;

  return send({
    to: opts.email,
    subject: "Книгата е твоя: ето как влизаш",
    html,
    text,
    idempotencyKey: `purchase-${opts.sessionId}`,
  });
}

/** Brand banner (Gesha and Homie). If images are blocked, the alt text still names the brand. */
function header(site: string): string {
  return `<a href="${site}" style="display:block;margin:0 0 22px;text-decoration:none"><img src="${site}/email-header-v2.jpg" width="560" alt="Кухнята на Геша" style="display:block;width:100%;max-width:560px;height:auto;border:0;border-radius:14px;color:#6b7f3a;font-weight:800;font-size:15px"></a>`;
}

/**
 * One reminder to someone who opened the book checkout, typed their email,
 * ticked the marketing consent box and did not pay. The link is Stripe's
 * recovery URL: it opens a fresh checkout with the same book.
 */
export async function sendCartReminder(opts: { email: string; link: string; sessionId: string }): Promise<boolean> {
  const text = [
    "Здравей,",
    "",
    "Видях, че започна поръчка на „Кухнята на Геша“, но не я довърши. Ако нещо те спря или имаш въпрос, просто ми отговори на този имейл.",
    "",
    "Ако искаш да продължиш, ето линк. Отваря същото плащане:",
    opts.link,
    "",
    "Вътре те чакат 100+ рецепти с калориите и макросите, менюта по твоите калории и бонусът с нови рецепти.",
    "",
    "Геша",
  ].join("\n");
  const html = `<!doctype html><html lang="bg"><body style="margin:0;background:#ffffff">
<div style="max-width:560px;margin:0 auto;padding:28px 22px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;color:#2b2a26">
<p style="margin:0 0 14px;line-height:1.6">Здравей,</p>
<p style="margin:0 0 14px;line-height:1.6">Видях, че започна поръчка на „Кухнята на Геша“, но не я довърши. Ако нещо те спря или имаш въпрос, просто ми отговори на този имейл.</p>
<p style="margin:0 0 14px;line-height:1.6">Ако искаш да продължиш, ето линк. Отваря същото плащане:<br><a href="${esc(opts.link)}" style="color:#6b7f3a;font-weight:700">Довърши поръчката</a></p>
<p style="margin:0 0 14px;line-height:1.6">Вътре те чакат 100+ рецепти с калориите и макросите, менюта по твоите калории и бонусът с нови рецепти.</p>
<p style="margin:0 0 14px;line-height:1.6">Геша</p>
<p style="margin:22px 0 0;font-size:12px;color:#8a8a80">Пиша ти, защото при плащането се съгласи да получаваш имейли от мен. Не искаш повече? Отговори ми със „стоп“.</p>
</div></body></html>`;
  return send({ to: opts.email, subject: "Поръчката ти остана недовършена", html, text, idempotencyKey: `cart-${opts.sessionId}` });
}

/** Sent after a gift purchase: one link per friend. */
export async function sendGiftEmail(opts: { email: string; codes: string[]; sessionId: string }): Promise<boolean> {
  const site = getSiteUrl();
  const links = opts.codes.map((c) => `${site}/podarak/${c}`);
  const one = links.length === 1;
  const text = [
    "Здравей,",
    "",
    one
      ? "Благодаря ти! Ето линка за подаръка. Прати го на човека, на когото подаряваш книгата:"
      : "Благодаря ти! Ето линковете за подаръците. Всеки е за един човек:",
    "",
    ...links,
    "",
    "Който отвори линка, влиза със своя имейл и получава всичките 100+ рецепти и същия бонус с нови рецепти, точно като теб.",
    `Линковете ги виждаш и в Профил: ${site}/account`,
    "",
    "Геша",
  ].join("\n");
  const html = `<!doctype html><html lang="bg"><body style="margin:0;background:#ffffff">
<div style="max-width:560px;margin:0 auto;padding:28px 22px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;color:#2b2a26">
<p style="margin:0 0 14px;line-height:1.6">Здравей,</p>
<p style="margin:0 0 14px;line-height:1.6">${one ? "Благодаря ти! Ето линка за подаръка. Прати го на човека, на когото подаряваш книгата:" : "Благодаря ти! Ето линковете за подаръците. Всеки е за един човек:"}</p>
${links.map((l) => `<p style="margin:0 0 10px"><a href="${esc(l)}" style="color:#6b7f3a;font-weight:700">${esc(l.replace(/^https?:\/\//, ""))}</a></p>`).join("")}
<p style="margin:16px 0 14px;line-height:1.6">Който отвори линка, влиза със своя имейл и получава всичките 100+ рецепти и същия бонус с нови рецепти, точно като теб.</p>
<p style="margin:0 0 14px;line-height:1.6">Линковете ги виждаш и в <a href="${site}/account" style="color:#6b7f3a">Профил</a>.</p>
<p style="margin:0 0 14px;line-height:1.6">Геша</p>
</div></body></html>`;
  return send({ to: opts.email, subject: one ? "Подаръкът ти е готов" : "Подаръците ти са готови", html, text, idempotencyKey: `gift-${opts.sessionId}` });
}

const wrap = (body: string) =>
  `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#2b2a26;font-size:16px;line-height:1.6">${header(getSiteUrl())}${body}<p style="margin-top:26px;font-size:13px;color:#8a8a80">Не искаш такива имейли? Отговори ми с „стоп“ и спирам.</p></div>`;

/** 7 days after the purchase: ask what they cooked (real testimonials). */
export async function sendReviewRequest(email: string): Promise<boolean> {
  const site = getSiteUrl();
  const text = [
    "Здравей! Мина седмица, откакто взе „Кухнята на Геша“.",
    "Какво сготви досега? Ще се радвам да ми пратиш снимка и няколко думи: какво ти хареса, какво се получи.",
    "Просто отговори на този имейл. Ако ми разрешиш, ще сложа снимката ти сред „Сготвено от вас“ на сайта.",
    "А ако нещо не ти се е получило, пак ми пиши, ще ти помогна.",
    `Рецептите: ${site}/recipes`,
    "Геша",
  ].join("\n\n");
  const html = wrap(
    `<p>Здравей! Мина седмица, откакто взе „Кухнята на Геша“.</p>
<p><b>Какво сготви досега?</b> Ще се радвам да ми пратиш снимка и няколко думи: какво ти хареса, какво се получи.</p>
<p>Просто отговори на този имейл. Ако ми разрешиш, ще сложа снимката ти сред „Сготвено от вас“ на сайта.</p>
<p>А ако нещо не ти се е получило, пак ми пиши, ще ти помогна.</p>
<p><a href="${site}/recipes" style="display:inline-block;padding:12px 22px;background:#6b7f3a;color:#fff;border-radius:100px;text-decoration:none;font-weight:bold">Към рецептите</a></p>
<p>Геша</p>`
  );
  return send({ to: email, subject: "Какво сготви тази седмица? 📸", html, text, idempotencyKey: `review-${email}` });
}

/** Monday: the recipes added last week, to people with an active bonus or subscription. */
export async function sendNewRecipes(
  email: string,
  recipes: { id: number; title: string; kcal: number | null; proteinG: number | null }[],
  weekKey: string
): Promise<boolean> {
  const site = getSiteUrl();
  const line = (r: (typeof recipes)[number]) =>
    `${r.title}${r.kcal != null ? ` · ${r.kcal} kcal` : ""}${r.proteinG != null ? ` · ${r.proteinG} g протеин` : ""}`;
  const n = recipes.length;
  const subject = n === 1 ? `Нова рецепта тази седмица: ${recipes[0].title}` : `${n} нови рецепти тази седмица 🍽️`;
  const text = [
    "Здравей! Ето какво добавих тази седмица:",
    recipes.map((r) => `• ${line(r)} — ${site}/recipes?r=${r.id}`).join("\n"),
    `Всички нови рецепти по седмици: ${site}/novi`,
    "Приятно готвене!",
    "Геша",
  ].join("\n\n");
  const html = wrap(
    `<p>Здравей! Ето какво добавих тази седмица:</p>
<ul style="padding-left:20px">${recipes
      .map((r) => `<li style="margin:6px 0"><a href="${site}/recipes?r=${r.id}" style="color:#6b7f3a;font-weight:bold">${esc(r.title)}</a>${r.kcal != null ? ` · ${r.kcal} kcal` : ""}${r.proteinG != null ? ` · ${r.proteinG} g протеин` : ""}</li>`)
      .join("")}</ul>
<p><a href="${site}/novi" style="display:inline-block;padding:12px 22px;background:#6b7f3a;color:#fff;border-radius:100px;text-decoration:none;font-weight:bold">Виж всички нови рецепти</a></p>
<p>Приятно готвене!<br>Геша</p>`
  );
  return send({ to: email, subject, html, text, idempotencyKey: `new-${weekKey}-${email}` });
}

/** The one-off "Всичко наред ли е?" email with the Facebook group (Admin → Имейли). */
export const GROUP_INVITE = {
  subject: "Всичко наред ли е с книгата?",
  lines: [
    "Здравей! Геша е 👋",
    "Искам да те питам: всичко наред ли е с „Кухнята на Геша“? Успя ли да влезеш и да намериш рецептите? Ако нещо не работи или имаш въпрос, просто отговори на този имейл. Чета и отговарям сам на всеки.",
    "И още нещо: направих затворена група във Facebook само за хората с книгата. Там си показваме какво сме сготвили, питаме се за замени и първо там пускам новите неща. Пускам и полезни неща от мен за здраве и тренировки. А ако някой ден поискаш да тренираме заедно, там ще разбереш как. Ще се радвам да те видя вътре!",
  ],
  button: "Влез в групата",
  sign: "Геша и Хоуми 🐾",
};

export async function sendGroupInvite(email: string): Promise<boolean> {
  const group = COMMUNITY.url;
  if (!group) return false;
  const t = GROUP_INVITE;
  const text = [...t.lines, `Групата: ${group}`, t.sign].join("\n\n");
  const html = wrap(
    t.lines.map((l) => `<p>${esc(l)}</p>`).join("\n") +
      `<p><a href="${esc(group)}" style="display:inline-block;padding:12px 22px;background:#6b7f3a;color:#fff;border-radius:100px;text-decoration:none;font-weight:bold">${t.button}</a></p>
<p>${t.sign}</p>`
  );
  return send({ to: email, subject: t.subject, html, text, idempotencyKey: `group-invite-${email}` });
}

/** 7 days before the free bonus months end (daily cron): the 5,99 € reminder. */
export async function sendTrialReminder(email: string, trialEnd: string): Promise<boolean> {
  const site = getSiteUrl();
  const day = bgDate(trialEnd).replace(/ г\.$/, "");
  const lines = [
    "Здравей! Геша е 👋",
    `Обещах да ти напомня: безплатните ти месеци с нови рецепти свършват на ${day}.`,
    "Ако искаш да продължиш, не правиш нищо: абонаментът продължава за 5,99 € на месец и всеки месец получаваш 3–4 нови рецепти.",
    "Ако не искаш, спираш го с едно натискане от „Профил“ и не плащаш нищо. Рецептите от книгата си остават твои завинаги.",
    "А ако все пак забравиш и ти мине плащане, просто ми пиши и ти връщам парите. Не е проблем.",
  ];
  const text = [...lines, `Профил: ${site}/account`, "Геша и Хоуми 🐾"].join("\n\n");
  const html = wrap(
    lines.map((l) => `<p>${esc(l)}</p>`).join("\n") +
      `<p><a href="${site}/account" style="display:inline-block;padding:12px 22px;background:#6b7f3a;color:#fff;border-radius:100px;text-decoration:none;font-weight:bold">Към „Профил“</a></p>
<p>Геша и Хоуми 🐾</p>`
  );
  return send({
    to: email,
    subject: "След 7 дни свършват безплатните ти месеци",
    html,
    text,
    idempotencyKey: `trial-${email}-${trialEnd.slice(0, 10)}`,
  });
}

/* ───────────── Онлайн коучинг ───────────── */

const btn = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;padding:13px 22px;background:#6b7f3a;color:#fff;border-radius:100px;text-decoration:none;font-weight:bold">${esc(label)}</a>`;

/** Transactional (no "stop" footer). */
const wrapT = (body: string) =>
  `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#2b2a26;font-size:16px;line-height:1.6">${header(getSiteUrl())}${body}</div>`;

const paras = (lines: string[]) => lines.map((l) => `<p>${esc(l)}</p>`).join("\n");

/** Where new applications and payments are announced: COACHING_NOTIFY_EMAIL, else the first admin. */
function coachInbox(): string {
  return (
    process.env.COACHING_NOTIFY_EMAIL?.trim() ||
    (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim() ||
    "hello@geshapov.com"
  );
}

export async function sendCoachingApplied(opts: { id: string; email: string; name: string }): Promise<boolean> {
  const first = opts.name.split(" ")[0] || "";
  const cal = COACHING.calLink
    ? `https://cal.com/${COACHING.calLink}?name=${encodeURIComponent(opts.name)}&email=${encodeURIComponent(opts.email)}`
    : null;
  const lines = [
    `Здравей${first ? `, ${first}` : ""}! Геша е 👋`,
    "Получих анкетата ти за онлайн коучинга. Благодаря, че ми се довери!",
    cal
      ? "Следващата стъпка е 15-минутен разговор: запознаваме се и виждаме дали сме подходящи един за друг. Безплатен е и без ангажимент. Ако още нямаш час, избери тук:"
      : "Ще я прочета лично и до 48 часа ще ти пиша, за да си уговорим 15-минутен разговор. Запознаваме се и виждаме дали сме подходящи един за друг. Разговорът е безплатен и без ангажимент.",
  ];
  const tail = ["Ако искаш да добавиш нещо, просто отговори на този имейл."];
  return send({
    to: opts.email,
    subject: "Получих анкетата ти 💪",
    html: wrapT(paras(lines) + (cal ? `<p>${btn(cal, "Избери час за разговора")}</p>` : "") + paras(tail) + "<p>Геша и Хоуми 🐾</p>"),
    text: [...lines, ...(cal ? [cal] : []), ...tail, "Геша и Хоуми 🐾"].join("\n\n"),
    idempotencyKey: `coach-applied-${opts.id}`,
  });
}

/** To Gesha: a new application with everything from the form. */
export async function sendCoachingNotify(opts: { id: string; rows: [string, string][]; flagged: boolean }): Promise<boolean> {
  const site = getSiteUrl();
  const table = opts.rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 10px 4px 0;color:#5e5a4f;vertical-align:top">${esc(k)}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`)
    .join("");
  const name = opts.rows.find(([k]) => k === "Име")?.[1] ?? "";
  return send({
    to: coachInbox(),
    subject: `${opts.flagged ? "⚠️ " : ""}Нова анкета за коучинг: ${name}`,
    html: wrapT(
      `${opts.flagged ? '<p style="color:#b5562e"><b>⚠️ Има отметнат здравословен проблем: питай за него в разговора.</b></p>' : ""}<table style="border-collapse:collapse;font-size:15px">${table}</table><p style="margin-top:20px">${btn(`${site}/admin/kouching`, "Виж в Админ → Коучинг")}</p>`
    ),
    text: opts.rows.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\n${site}/admin/kouching`,
    idempotencyKey: `coach-new-${opts.id}`,
  });
}

export async function sendCoachingApproved(opts: {
  id: string;
  email: string;
  name: string;
  token: string;
  /** Cents already paid for the book: taken off the first payment. */
  credit: number;
}): Promise<boolean> {
  const site = getSiteUrl();
  const first = opts.name.split(" ")[0] || "";
  const month = `${site}/api/coaching/pay?t=${opts.token}&plan=month`;
  const three = `${site}/api/coaching/pay?t=${opts.token}&plan=three`;
  const lines = [
    `Здравей${first ? `, ${first}` : ""}! Геша е 👋`,
    "Благодаря ти за разговора! С радост ще работим заедно 💪",
    "Остава само да избереш плана си. Мястото ти е запазено за 3 дни.",
    ...(opts.credit > 0
      ? [`Вече имаш книгата, затова ти връщам парите за нея: ${(opts.credit / 100).toFixed(2).replace(".", ",")} € се приспадат автоматично от първото плащане.`]
      : ["Книгата „Кухнята на Геша“ е включена и остава твоя."]),
  ];
  const after = [
    "След плащането получаваш имейл с първите стъпки, книгата е в профила ти и аз ти пиша лично. Започваме на 1 декември.",
    "Въпроси? Просто отговори на този имейл.",
  ];
  const html = wrapT(
    paras(lines) +
      `<p style="margin:22px 0 6px"><b>3 месеца: 237 €</b> (плащаш веднъж за 3-те месеца, спестяваш 54 €)<br><span style="color:#5e5a4f;font-size:14px">Еднократно плащане. Най-добрият вариант за истински резултат.</span></p><p>${btn(three, "Избирам 3 месеца")}</p>` +
      `<p style="margin:22px 0 6px"><b>Месечно: 97 € на месец</b><br><span style="color:#5e5a4f;font-size:14px">Спираш, когато поискаш, с едно съобщение до мен.</span></p><p>${btn(month, "Избирам месечно")}</p>` +
      paras(after) +
      "<p>Геша и Хоуми 🐾</p>"
  );
  return send({
    to: opts.email,
    subject: "Мястото ти в коучинга е запазено 🎉",
    html,
    text: [...lines, `3 месеца, 237 €: ${three}`, `Месечно, 97 €: ${month}`, ...after, "Геша и Хоуми 🐾"].join("\n\n"),
    idempotencyKey: `coach-ok-${opts.id}`,
  });
}

export async function sendCoachingRejected(opts: { id: string; email: string; name: string }): Promise<boolean> {
  const site = getSiteUrl();
  const first = opts.name.split(" ")[0] || "";
  const lines = [
    `Здравей${first ? `, ${first}` : ""}! Геша е 👋`,
    "Благодаря ти за интереса към онлайн коучинга.",
    "Този път няма да мога да те взема: местата са само 10 и искам всеки човек да получи пълното ми внимание. Записвам те и ще пиша първо на теб, когато се освободи място.",
    "Дотогава можеш да започнеш с книгата „Кухнята на Геша“: 100+ рецепти с калориите и протеина, меню за всяка седмица и калкулатор.",
  ];
  return send({
    to: opts.email,
    subject: "За коучинга",
    html: wrapT(paras(lines) + `<p>${btn(site, "Виж книгата")}</p><p>Геша и Хоуми 🐾</p>`),
    text: [...lines, site, "Геша и Хоуми 🐾"].join("\n\n"),
    idempotencyKey: `coach-no-${opts.id}`,
  });
}

/** After payment: welcome to the client and a heads-up to Gesha. */
export async function sendCoachingWelcome(opts: {
  sessionId: string;
  email: string;
  name: string;
  plan: "month" | "three";
  contact: string;
}): Promise<void> {
  const site = getSiteUrl();
  const first = opts.name.split(" ")[0] || "";
  const planText = opts.plan === "three" ? "3 месеца (237 €)" : "месечно (97 € на месец)";
  const lines = [
    `Радвам се, че започваме заедно${first ? `, ${first}` : ""}! 🎉`,
    `Плащането мина: ${planText}. Ето какво следва:`,
    `1. До 48 часа ти пиша лично в ${opts.contact || "Viber/WhatsApp"} и ти пращам плана: твоите калории и протеин, менюто за първата седмица и тренировките.`,
    "2. Книгата „Кухнята на Геша“ вече е отключена: влизаш с този имейл, без парола.",
    "3. Всяка неделя ми пращаш теглото си и как мина седмицата. В понеделник оправям плана, ако трябва.",
    "Едно нещо от теб още сега: снимай се отпред и отстрани (на същото място и светлина) и си запиши теглото сутрин на гладно. Това е началната точка и след 4 седмици ще благодариш, че го направи.",
  ];
  const tail =
    opts.plan === "month"
      ? "Месечният план се подновява автоматично. Спираш го, когато поискаш, с едно съобщение до мен преди следващото плащане."
      : "Трите месеца са платени изцяло. Няма автоматично подновяване.";
  const login = `${site}/login?email=${encodeURIComponent(opts.email)}`;
  await send({
    to: opts.email,
    subject: "Започваме! 💪 Първите стъпки в коучинга",
    html: wrapT(paras(lines) + `<p>${btn(login, "Влез в книгата")}</p>` + paras([tail]) + "<p>Започваме! Геша и Хоуми 🐾</p>"),
    text: [...lines, `Вход: ${login}`, tail, "Започваме! Геша и Хоуми 🐾"].join("\n\n"),
    idempotencyKey: `coach-welcome-${opts.sessionId}`,
  }).catch(() => false);
  await send({
    to: coachInbox(),
    subject: `💰 Платен коучинг: ${opts.name} (${planText})`,
    html: wrapT(`<p><b>${esc(opts.name)}</b> (${esc(opts.email)}) плати ${esc(planText)}.</p><p>Пиши в ${esc(opts.contact || "—")} до 48 часа.</p><p>${btn(`${site}/admin/kouching`, "Към клиентите")}</p>`),
    text: `${opts.name} (${opts.email}) плати ${planText}. Пиши в ${opts.contact || "—"}.`,
    idempotencyKey: `coach-paid-${opts.sessionId}`,
  }).catch(() => false);
}
