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
  trialEnd: string | null;
  sessionId: string;
}): Promise<boolean> {
  const site = getSiteUrl();
  const login = `${site}/login?email=${encodeURIComponent(opts.email)}`;
  const paid = bgDate(opts.paidAt * 1000);
  const until = opts.trialEnd ? bgDate(opts.trialEnd) : null;

  const text = [
    "Здравей,",
    "",
    `Благодаря ти, че взе „Кухнята на Геша“! Плащането мина и всичките 101 рецепти вече са отключени за теб.`,
    "",
    "КАК ВЛИЗАШ",
    `1. Отвори ${site}/login`,
    `2. Напиши този имейл: ${opts.email}`,
    "3. Ще ти пратя линк за вход, без парола. Сайтът те помни на устройството.",
    "",
    ...(until
      ? [
          "БОНУС: 3 МЕСЕЦА НОВИ РЕЦЕПТИ",
          `Всяка седмица добавям 2–4 нови рецепти. Имаш ги безплатно до ${until}, без карта.`,
          "Ако искаш да продължиш след това, добавяш карта от „Профил“ и абонаментът е 5,99 € на месец, докато не го спреш. Ако не добавиш карта, просто спира, без такси.",
          "",
        ]
      : []),
    ...(COMMUNITY.url
      ? [
          "ОБЩНОСТТА В SKOOL",
          "Присъедини се от линка по-долу. Там членовете споделят какво са сготвили, а аз качвам видеа за здраве и уелнес.",
          `Линк към общността: ${COMMUNITY.url}`,
          "",
        ]
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
<p style="margin:0 0 22px;font-size:13px;font-weight:800;letter-spacing:.1em;color:#6b7f3a">КУХНЯТА НА ГЕША</p>
${p("Здравей,")}
${p("Благодаря ти, че взе „Кухнята на Геша“! Плащането мина и всичките <b>101 рецепти</b> вече са отключени за теб.")}
<p style="margin:20px 0 22px"><a href="${esc(login)}" style="display:inline-block;background:#6b7f3a;color:#fff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:100px">Влез в рецептите</a></p>
${h("КАК ВЛИЗАШ")}
${p(`Влизаш с този имейл: <b>${esc(opts.email)}</b>. Пращам ти линк за вход, без парола, и сайтът те помни на устройството.`)}
${
  until
    ? h("БОНУС: 3 МЕСЕЦА НОВИ РЕЦЕПТИ") +
      p(`Всяка седмица добавям 2–4 нови рецепти. Имаш ги безплатно до <b>${esc(until)}</b>, без карта.`) +
      p("Ако искаш да продължиш след това, добавяш карта от „Профил“ и абонаментът е 5,99 € на месец, докато не го спреш. Ако не добавиш карта, просто спира, без такси.")
    : ""
}
${
  COMMUNITY.url
    ? h("ОБЩНОСТТА В SKOOL") +
      p(`<a href="${esc(COMMUNITY.url)}" style="color:#6b7f3a">Влез от тук</a> и се присъедини. Там членовете споделят какво са сготвили, а аз качвам видеа за здраве и уелнес.`)
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
