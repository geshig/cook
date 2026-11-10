import "server-only";
import { COMMUNITY, CONTACT_EMAIL, getSiteUrl } from "./site";
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
  /** Where "Reply" goes; by default hello@. */
  replyTo?: string;
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
      reply_to: opts.replyTo ?? "hello@geshapov.com",
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

export type CoachingRequest = {
  name: string;
  email: string;
  contact: string;
  format: string;
  goal: string;
  age: string;
  height: string;
  weight: string;
  experience: string;
  days: string;
  health: string;
  message: string;
};

/**
 * /trenirai-s-men: the filled form goes to hello@ (forwarded to the inbox).
 * "Reply" answers the person directly. Nothing is stored in the database.
 */
export async function sendCoachingRequest(r: CoachingRequest): Promise<boolean> {
  const rows: [string, string][] = [
    ["Име", r.name],
    ["Имейл", r.email],
    ["Телефон / Instagram", r.contact],
    ["Как иска да тренира", r.format],
    ["Цел", r.goal],
    ["Възраст", r.age],
    ["Ръст", r.height ? `${r.height} см` : ""],
    ["Тегло", r.weight ? `${r.weight} кг` : ""],
    ["Опит", r.experience],
    ["Дни в седмицата", r.days],
    ["Контузии / здраве", r.health],
    ["Съобщение", r.message],
  ];
  const filled = rows.filter(([, v]) => v.trim());
  const text = [
    "Нова заявка от „Тренирай с мен“. Натисни „Отговор“, за да пишеш директно на човека.",
    "",
    ...filled.map(([k, v]) => `${k}: ${v}`),
  ].join("\n");
  const html = wrap(
    `<p>Нова заявка от „Тренирай с мен“. Натисни <b>„Отговор“</b>, за да пишеш директно на човека.</p>
<table style="border-collapse:collapse;width:100%;font-size:15px">${filled
      .map(
        ([k, v]) =>
          `<tr><td style="padding:7px 10px 7px 0;color:#5e5a4f;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:7px 0;vertical-align:top;white-space:pre-wrap"><b>${esc(v)}</b></td></tr>`
      )
      .join("")}</table>`
  );
  return send({
    to: CONTACT_EMAIL,
    replyTo: r.email,
    subject: `Тренирай с мен: ${r.name} (${r.format}, ${r.goal})`,
    html,
    text,
    idempotencyKey: `coach-${r.email}-${Date.now()}`,
  });
}

/** The short "I got it" note to the person who filled the form. */
export async function sendCoachingThanks(email: string, name: string): Promise<boolean> {
  const first = name.trim().split(/\s+/)[0] ?? "";
  const lines = [
    `Здравей${first ? `, ${first}` : ""}! Геша е 👋`,
    "Получих заявката ти за тренировки с мен. Благодаря за доверието!",
    "Ще я прочета внимателно и ще ти пиша лично до 2 работни дни, за да поговорим какво искаш да постигнеш и как да го направим заедно.",
    "Ако междувременно се сетиш за нещо, просто отговори на този имейл.",
  ];
  return send({
    to: email,
    subject: "Получих заявката ти за тренировки",
    html: wrap(lines.map((l) => `<p>${esc(l)}</p>`).join("\n") + "<p>Геша и Хоуми 🐾</p>"),
    text: [...lines, "Геша и Хоуми 🐾"].join("\n\n"),
    idempotencyKey: `coach-thanks-${email}-${new Date().toISOString().slice(0, 13)}`,
  });
}
