import "server-only";
import { COMMUNITY, getSiteUrl } from "./site";

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
  const from = process.env.EMAIL_FROM?.trim() || "Кухнята на Геша <hello@geshapov.com>";
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
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });
  if (!res.ok) {
    console.error("Resend error", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
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

  const text = [
    "Здравей,",
    "",
    `Благодаря ти, че взе „Кухнята на Геша“! Плащането мина и всичките 100+ рецепти вече са отключени за теб.`,
    "",
    "КАК ВЛИЗАШ",
    `1. Отвори ${site}/login`,
    `2. Напиши този имейл: ${opts.email}`,
    "3. Ще ти пратя линк за вход, без парола. Сайтът те помни на устройството.",
    "",
    `🎁 ТВОЯТ БОНУС: ${months.toUpperCase()} НОВИ РЕЦЕПТИ БЕЗПЛАТНО`,
    `Всяка седмица добавям 2–4 нови рецепти. С книгата имаш ${months} достъп до тях безплатно. Вземи ги с едно натискане: ${claim}`,
    "След безплатния период е 5,99 € на месец, само ако не спреш абонамента. Спираш го по всяко време от „Профил“.",
    "",
    ...(COMMUNITY.url
      ? [
          "ОБЩНОСТТА В SKOOL",
          "Присъедини се от линка по-долу. Там членовете споделят какво са сготвили, а аз качвам видеа за здраве и уелнес.",
          `Линк към общността: ${COMMUNITY.url}`,
          "",
        ]
      : []),
    ...(giftLinks.length
      ? ["ЛИНК ЗА ВТОРИЯ ЧОВЕК", "Прати този линк на човека, с когото купихте книгата. Той влиза със своя имейл:", ...giftLinks, ""]
      : []),
    "СЪВЕТ: На телефона добави сайта на началния екран и се отваря като приложение.",
    "",
    "ЗА ПОКУПКАТА",
    `Купи: онлайн достъп до рецептите в книгата „Кухнята на Геша“ на ${site.replace(/^https?:\/\//, "")}, ${opts.amount} еднократно, на ${paid}.`,
    "При плащането се съгласи с Условията за ползване и поиска достъпът да започне веднага. Затова правото на отказ в 14 дни не важи за книгата.",
    `Условията: ${site}/usloviya`,
    "",
    "Въпроси? Просто отговори на този имейл.",
    "",
    "Геша",
  ].join("\n");

  const p = (s: string) => `<p style="margin:0 0 14px;line-height:1.6">${s}</p>`;
  const h = (s: string) =>
    `<p style="margin:22px 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;color:#6b7f3a">${s}</p>`;
  const html = `<!doctype html><html lang="bg"><body style="margin:0;background:#faf6ee">
<div style="max-width:560px;margin:0 auto;padding:28px 22px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;color:#2b2a26">
${header(site)}
${p("Здравей,")}
${p("Благодаря ти, че взе „Кухнята на Геша“! Плащането мина и всичките <b>100+ рецепти</b> вече са отключени за теб.")}
<p style="margin:20px 0 22px"><a href="${esc(login)}" style="display:inline-block;background:#6b7f3a;color:#fff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:100px">Влез в рецептите</a></p>
${h("КАК ВЛИЗАШ")}
${p(`Влизаш с този имейл: <b>${esc(opts.email)}</b>. Пращам ти линк за вход, без парола, и сайтът те помни на устройството.`)}
<div style="margin:24px 0 8px;padding:18px;background:#27311b;border-radius:16px;color:#f4efe1">
<p style="margin:0 0 6px;font-size:17px;font-weight:800">🎁 Твоят бонус: ${months} нови рецепти безплатно</p>
<p style="margin:0 0 14px;line-height:1.55;color:#dcd8c8">Всяка седмица добавям 2–4 нови рецепти. Вземи ги с едно натискане.</p>
<a href="${esc(claim)}" style="display:inline-block;background:#f4efe1;color:#27311b;text-decoration:none;font-weight:800;padding:12px 22px;border-radius:100px">Вземи ${months} безплатно</a>
<p style="margin:12px 0 0;font-size:12px;line-height:1.5;color:#bdb9a8">След безплатния период е 5,99 € на месец, само ако не спреш абонамента. Спираш го по всяко време от „Профил“.</p>
</div>
${
  COMMUNITY.url
    ? h("ОБЩНОСТТА В SKOOL") +
      p(`<a href="${esc(COMMUNITY.url)}" style="color:#6b7f3a">Влез от тук</a> и се присъедини. Там членовете споделят какво са сготвили, а аз качвам видеа за здраве и уелнес.`)
    : ""
}
${
  giftLinks.length
    ? h("ЛИНК ЗА ВТОРИЯ ЧОВЕК") +
      p("Прати този линк на човека, с когото купихте книгата. Той влиза със своя имейл:") +
      giftLinks.map((l) => `<p style="margin:0 0 14px"><a href="${esc(l)}" style="color:#6b7f3a;font-weight:700">🎁 ${esc(l.replace(/^https?:\/\//, ""))}</a></p>`).join("")
    : ""
}
${h("СЪВЕТ")}
${p("На телефона добави сайта на началния екран и се отваря като приложение.")}
<div style="margin-top:26px;padding:14px 16px;background:#fffdf8;border:1px solid #e6dfcf;border-radius:12px;font-size:13px;color:#5e5a4f;line-height:1.55">
<b style="color:#2b2a26">За покупката.</b> Купи: онлайн достъп до рецептите в книгата „Кухнята на Геша“, ${esc(opts.amount)} еднократно, на ${esc(paid)}. При плащането се съгласи с <a href="${site}/usloviya" style="color:#6b7f3a">Условията за ползване</a> и поиска достъпът да започне веднага. Затова правото на отказ в 14 дни не важи за книгата.
</div>
${p("")}
${p("Въпроси? Просто отговори на този имейл.")}
${p("Геша")}
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
  return `<a href="${site}" style="display:block;margin:0 0 22px;text-decoration:none"><img src="${site}/email-header.jpg" width="560" alt="Кухнята на Геша" style="display:block;width:100%;max-width:560px;height:auto;border:0;border-radius:14px;color:#6b7f3a;font-weight:800;font-size:15px"></a>`;
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
  const html = `<!doctype html><html lang="bg"><body style="margin:0;background:#faf6ee">
<div style="max-width:560px;margin:0 auto;padding:28px 22px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;color:#2b2a26">
${header(site)}
<p style="margin:0 0 14px;line-height:1.6">Здравей,</p>
<p style="margin:0 0 14px;line-height:1.6">${one ? "Благодаря ти! Ето линка за подаръка. Прати го на човека, на когото подаряваш книгата:" : "Благодаря ти! Ето линковете за подаръците. Всеки е за един човек:"}</p>
${links.map((l) => `<p style="margin:0 0 10px"><a href="${esc(l)}" style="display:inline-block;background:#6b7f3a;color:#fff;text-decoration:none;font-weight:700;padding:11px 18px;border-radius:100px">🎁 ${esc(l.replace(/^https?:\/\//, ""))}</a></p>`).join("")}
<p style="margin:16px 0 14px;line-height:1.6">Който отвори линка, влиза със своя имейл и получава всичките 100+ рецепти и същия бонус с нови рецепти, точно като теб.</p>
<p style="margin:0 0 14px;line-height:1.6">Линковете ги виждаш и в <a href="${site}/account" style="color:#6b7f3a">Профил</a>.</p>
<p style="margin:0 0 14px;line-height:1.6">Геша</p>
</div></body></html>`;
  return send({ to: opts.email, subject: one ? "Подаръкът ти е готов 🎁" : "Подаръците ти са готови 🎁", html, text, idempotencyKey: `gift-${opts.sessionId}` });
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
    "Приятно готвене!",
    "Геша",
  ].join("\n\n");
  const html = wrap(
    `<p>Здравей! Ето какво добавих тази седмица:</p>
<ul style="padding-left:20px">${recipes
      .map((r) => `<li style="margin:6px 0"><a href="${site}/recipes?r=${r.id}" style="color:#6b7f3a;font-weight:bold">${esc(r.title)}</a>${r.kcal != null ? ` · ${r.kcal} kcal` : ""}${r.proteinG != null ? ` · ${r.proteinG} g протеин` : ""}</li>`)
      .join("")}</ul>
<p><a href="${site}/recipes" style="display:inline-block;padding:12px 22px;background:#6b7f3a;color:#fff;border-radius:100px;text-decoration:none;font-weight:bold">Отвори рецептите</a></p>
<p>Приятно готвене!<br>Геша</p>`
  );
  return send({ to: email, subject, html, text, idempotencyKey: `new-${weekKey}-${email}` });
}
