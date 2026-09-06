# Кухнята

Next.js приложение за готварско съдържание с тагове, еднократна книга и
месечен абонамент за ексклузивни рецепти. Виж `claudecodebrief.md` (в
разговора, не в repo-то) за пълния бизнес контекст — това README покрива
само техническото setup-ване.

## Архитектура накратко

- **Next.js (App Router)** — landing страница (`/`), приложението с
  рецептите (`/recipes`), вход с magic link (`/login`), профил (`/account`).
- **Supabase (Postgres + Auth)** — данните и автентикацията. Auth е само
  magic link по имейл — без пароли.
- **Stripe** — Checkout за книгата (еднократно плащане) и за абонамента
  (recurring), плюс webhook и Billing Portal.
- **Vercel** — естественият deploy target за Next.js + Supabase.

### Как е решен паричния въпрос (важно за сигурността)

Всички заявки към `recipes` и `subscribers` минават през **service role**
ключа на Supabase, единствено в сървърен код (`lib/supabase/admin.ts`,
маркиран с `import "server-only"` — build-ва се грешка, ако някой го
импортне в клиентски компонент). Браузърът никога не пита Supabase
директно за рецепти — само за magic-link вход.

`lib/access.ts` е единственото място, което решава кой какво вижда:
проверява истинската сесия на потребителя (Supabase Auth), после гледа
неговия ред в `subscribers` (пълнен единствено от Stripe webhook-а).
`lib/recipes.ts` маха `ingredients` / `steps` / `video_url` от заключените
рецепти още на сървъра, преди да опаковаме отговора към клиента — така
заключеното видео линкче никога не се появява в HTML/JSON-а на непроверен
посетител, дори през view-source или Network tab.

RLS е включен на всички таблици без нито една policy за `anon` /
`authenticated` — това означава **default-deny**: дори някой да открадне
anon ключа, PostgREST няма да върне и ред от `recipes` или `subscribers`.
Единственият път навътре е service role ключа, който живее само на
сървъра (Vercel env vars), никога в браузъра.

Достъп до пълния каталог (`/recipes`) изисква купена книга ИЛИ активен
абонамент (виж `hasBookAccess` в `lib/access.ts`) — абонаментите винаги
имат достъп и до книгата, защото абонаментът е ъпсел върху нея. Отделно,
рецепти с `is_locked = true` изискват активен абонамент, независимо от
книгата.

## Setup — стъпка по стъпка

### 1. Supabase проект

1. Създай проект в [supabase.com](https://supabase.com).
2. Отвори SQL Editor и пусни, **в този ред**:
   - `supabase/schema.sql` — таблиците `recipes`, `tags`, `recipe_tags`,
     `subscribers` (непроменени от оригиналния файл от брифа).
   - `supabase/seed.sql` — пълните 50 тага, таблицата `leads` (за
     лийд-магнита от landing страницата) и RLS default-deny policy-тата.
   - (по избор) `supabase/sample-data.sql` — 8 примерни рецепти за локално
     тестване, преди да имаш истинско съдържание. **Изтрий преди реален
     launch** (`delete from recipes;`).
3. Project Settings → API — вземи `Project URL`, `anon public` ключа и
   `service_role` ключа.
4. Authentication → Email — увери се, че "Enable email provider" е
   включено и magic link е активен (по подразбиране е). Ако ползваш
   собствен домейн, конфигурирай SMTP тук (Supabase-овия default имейл
   sender е ограничен по обем и не е подходящ за реален launch).
5. Authentication → URL Configuration → добави
   `https://твоя-домейн.com/auth/callback` (и `http://localhost:3000/auth/callback`
   за локална разработка) към Redirect URLs.

### 2. Stripe

1. Създай два продукта в Stripe Dashboard → Product catalog:
   - **Книга** — one-time price, ~25€.
   - **Абонамент** — recurring price (месечно), ~15€ (или каквато цена
     решиш).
2. Копирай двата `price_...` ID-та.
3. Developers → Webhooks → Add endpoint:
   - URL: `https://твоя-домейн.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`,
     `customer.subscription.deleted`.
   - Копирай signing secret-а (`whsec_...`).
4. Developers → API keys → копирай secret key-я (`sk_...`).
5. Settings → Billing → Customer portal — включи го (нужен е за
   "Управление на плащания" в `/account`).

### 3. Env vars

Копирай `.env.example` в `.env.local` и попълни всичко от стъпки 1-2.

```bash
cp .env.example .env.local
```

### 4. Локална разработка

```bash
npm install
npm run dev
```

Отвори [http://localhost:3000](http://localhost:3000). За да тестваш
Stripe webhook-а локално, ползвай Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

(това ти дава отделен, локален `whsec_...` за `.env.local`, различен от
production endpoint-а).

### 5. Deploy на Vercel

1. Push repo-то в GitHub, import-ни го във Vercel.
2. Добави същите env vars от `.env.local` в Vercel → Project Settings →
   Environment Variables (задай `NEXT_PUBLIC_SITE_URL` на реалния домейн).
3. След първия deploy, обнови Stripe webhook endpoint-а и Supabase Redirect
   URL да сочат към реалния домейн вместо localhost.

## Структура на кода

```
app/
  page.tsx                     landing страница (hero, лийд форма, pricing, FAQ)
  login/page.tsx                magic-link вход
  auth/callback/route.ts        разменя Supabase code за сесия
  auth/signout/route.ts
  recipes/page.tsx               заключен зад книгата; рендерира <RecipeApp>
  account/page.tsx               статус на книга/абонамент + billing portal
  api/leads/route.ts             лийд магнит формата -> таблица `leads`
  api/checkout/book/route.ts     Stripe Checkout, mode=payment
  api/checkout/subscription/route.ts   Stripe Checkout, mode=subscription
  api/billing-portal/route.ts    Stripe Billing Portal сесия
  api/webhooks/stripe/route.ts   единственият писател в `subscribers`
components/
  RecipeApp.tsx                  тагбар + грид + detail sheet (клиентски)
  LeadForm.tsx, CheckoutButton.tsx, ManageBillingButton.tsx, SiteHeader.tsx
lib/
  supabase/admin.ts              service-role клиент — само сървър
  supabase/server.ts             auth-само клиент, четe сесия от cookies
  supabase/browser.ts            браузърен клиент, само за magic-link
  access.ts                      кой какво вижда (единственото място)
  recipes.ts                     четене + редакция на заключено съдържание
  stripe.ts
supabase/
  schema.sql                     оригиналната схема от брифа, непроменена
  seed.sql                       50-те тага + `leads` таблица + RLS
  sample-data.sql                примерни рецепти, само за локално тестване
```

## Какво съзнателно НЕ е построено

- **Изпращане на имейла с 3-те безплатни рецепти** — `/api/leads` пише в
  таблица `leads`; реалното изпращане (авто-отговор с рецептите) очаква
  свързване с ESP (напр. Resend, Mailchimp, ConvertKit) по твой избор,
  извън обхвата на този build.
- **ДДС регистрация / фактуриране** — под прага в брифа, за проверка със
  счетоводител преди launch, не е технически проблем сега.
- Реален Supabase / Stripe / Vercel акаунт — build-нато е и локално
  тествано (`npm run build`, dev сървър с dummy env vars), но не е
  deploy-нато никъде, защото няма креденшъли в тази среда.
