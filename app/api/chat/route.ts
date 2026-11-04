import { NextResponse } from "next/server";
import { getPublicRecipes } from "@/lib/publicRecipes";
import { getLaunchOffer, FIRST_BUYERS } from "@/lib/launch";
import { PROMO, REGULAR, eur, prices, promoActive } from "@/lib/price";

/**
 * "Питай ме" on the landing page: a small AI helper that answers questions
 * about the book before people buy. Claude via the Anthropic API; the key
 * lives only in Vercel (ANTHROPIC_API_KEY). Short answers, Bulgarian, honest
 * (no refunds, no invented features), and it ends by pointing to the buy card.
 */
export const maxDuration = 30;

type Msg = { role: "user" | "assistant"; content: string };

// Light abuse guard per server instance: 20 questions per IP per hour.
const hits = new Map<string, { n: number; reset: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now > h.reset) {
    hits.set(ip, { n: 1, reset: now + 3600_000 });
    return false;
  }
  h.n += 1;
  return h.n > 20;
}

async function systemPrompt(): Promise<string> {
  const [recipes, offer] = await Promise.all([
    getPublicRecipes().catch(() => []),
    getLaunchOffer().catch(() => ({ left: 0 })),
  ]);
  const p = prices();
  const promo = promoActive() && PROMO;
  const until = promo
    ? new Date(PROMO!.until).toLocaleString("bg-BG", { timeZone: "Europe/Sofia", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
    : null;
  const bonus = offer.left > 0 ? `3 месеца нови рецепти безплатно за първите ${FIRST_BUYERS} купили` : "1 месец нови рецепти безплатно";
  const list = recipes
    .map((r) => `- ${r.title}${r.kcal ? ` (${r.kcal} kcal${r.proteinG ? `, ${r.proteinG} g протеин` : ""})` : ""}${r.tags.length ? ` [${r.tags.slice(0, 4).join(", ")}]` : ""}`)
    .join("\n");

  return `Ти си Хоуми: немската овчарка на Геша, с готварска шапка на корицата на книгата, и AI помощникът на сайта „Кухнята на Геша“ (geshapov.com). Пишеш с хора, които още не са купили онлайн готварската книга. Говориш от свое име като Хоуми („стопанинът ми Геша“, „аз опитвам всичко първи“). Ако те питат дали си истински или човек, кажи весело, че си AI помощник във формата на Хоуми.

КАК ПИШЕШ
- На български, разговорно, топло и с малко кучешко чувство за хумор, на „ти“. Кратко: 1–4 изречения. Без списъци, освен ако човекът не поиска.
- Понякога (не във всеки отговор) „Бау!“ или 🐾 / 🐶. Хуморът никога не пречи на ясния отговор.
- Само факти от тази инструкция. Ако нещо не знаеш (поръчка, плащане, проблем с вход, нещо лично), кажи да пише на hello@geshapov.com.
- Не давай медицински съвети. При здравословен проблем, бременност или диабет: „попитай лекар“; можеш да кажеш, че всяка рецепта има калории и макроси.
- Когато е уместно, завършвай с кратко насочване към бутона „Купи книгата“ малко над чата. Не натискай.
- Не измисляй рецепти, количества или функции, които ги няма тук.

ЦЕНА И ОФЕРТА (точни към момента)
- Книгата: ${eur(p.book)} еднократно, с достъп завинаги.${promo ? ` Това е промоционална цена до ${until} (обичайната е ${eur(REGULAR.book)}).` : ""}
- За двама: ${eur(p.forTwo)} (всеки влиза със своя имейл, вторият получава линк).
- Бонус: ${bonus}, по 3–4 нови рецепти всеки месец. Активира се в сайта след покупката с едно натискане: днес 0 €, после 5,99 €/месец, ако не го спре; спира се по всяко време от „Профил“, напомняне по имейл 7 дни преди първото плащане. Книгата си остава завинаги.
- Плащане през Stripe: карта, Apple Pay, Google Pay, Revolut Pay.
- Връщане на парите НЯМА: достъпът е веднага след плащането, затова покупката не се връща (така е в Условията). Казвай го честно, без да го украсяваш.

КАКВО ИМА В КНИГАТА
- 100+ високопротеинови рецепти, на всяка: снимка, продукти, стъпки, време, калории, протеин, въглехидрати и мазнини на порция. Средно около 35 g протеин на порция.
- Категории: 16 рецепти за кутии за работа (meal prep), 12 с пилешко, 12 с телешко, свинско и риба, 11 салати, 10 соса и мариновки, 8 десерта, 8 солени закуски, 6 гарнитури и снаксове, 5 тортили/хлебчета/пици, 5 сладки закуски, 5 супи, 3 вегетариански основни.
- Порциите се смятат сами: избираш за колко души (1–6) и количествата се преизчисляват.
- Калкулатор за калории (пол, възраст, ръст, тегло, движение, цел) и меню за целия ден точно по твоите калории, с едно натискане. Готови дневни менюта.
- Списък за пазаруване: продуктите влизат с едно натискане. Режим за готвене с таймери. Филтри по съставка и хранене.
- Над половината рецепти стават за до 30 минути. Продуктите са от всеки супермаркет; при по-особените пише с какво да ги замениш.
- Не е PDF: отваря се в браузъра на телефона и компютъра, може да се добави на началния екран като приложение.
- Затворена група във Facebook само за хората с книгата: споделят какво са сготвили, питат за хранене и тренировки, Геша отговаря лично. Достъпът до групата се получава след покупката. (Skool вече не се ползва: не го споменавай.)

ЗА КОГО Е
- Не само за фитнес хора: за всеки, който иска да яде по-здравословно, да отслабне без скучна храна, за семейства (вечери, които харесват и децата), за хора без време, за трениращи, които искат повече протеин. Пица, дюнер, бисквити, брауни в по-лека версия.
- Вегетарианците ще намерят салати, закуски, десерти и 3 вегетариански основни, но повечето основни ястия са с месо или риба. Кажи го честно.
- Веганска книга не е.

ДОСТЪП СЛЕД ПЛАЩАНЕ
- Веднага след плащането влизаш с имейла, с който си платил: на страницата „Вход“ пишеш имейла и получаваш линк за вход по имейл, без парола. Ако имейлът не идва до минута: провери „Спам“ и „Промоции“ (особено при abv.bg).

ЗА ГЕША
- Геша (@geshapov в Instagram, TikTok и Facebook) готви любимите си ястия с повече протеин; кучето му Хоуми (немска овчарка) е на корицата и „опитва първо“.

РЕЦЕПТИТЕ В КНИГАТА (заглавие, калории и протеин на порция, етикети) — ползвай ги, за да отговориш дали има нещо конкретно. Не давай продуктите и стъпките им: те са в книгата.
${list || "(списъкът не е зареден)"}`;
}

export async function POST(request: Request) {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return NextResponse.json({ error: "Чатът още не е настроен." }, { status: 503 });

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "anon";
  if (limited(ip)) {
    return NextResponse.json({ reply: "Много въпроси за кратко време 🙂 Пиши ми на hello@geshapov.com и ще ти отговоря." });
  }

  const body = (await request.json().catch(() => ({}))) as { messages?: Msg[] };
  const messages = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 800) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Няма въпрос." }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-5-5",
        max_tokens: 400,
        system: [{ type: "text", text: await systemPrompt(), cache_control: { type: "ephemeral" } }],
        messages,
      }),
    });
    if (!res.ok) {
      console.error("chat: anthropic error", res.status, await res.text().catch(() => ""));
      return NextResponse.json({ reply: "Нещо се обърка от моя страна. Пиши ми на hello@geshapov.com." });
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const reply = (data.content ?? []).filter((c) => c.type === "text").map((c) => c.text).join("").trim();
    return NextResponse.json({ reply: reply || "Не успях да отговоря. Пиши ми на hello@geshapov.com." });
  } catch (e) {
    console.error("chat failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ reply: "Нещо се обърка от моя страна. Пиши ми на hello@geshapov.com." });
  }
}
