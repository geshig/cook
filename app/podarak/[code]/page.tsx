import type { Metadata } from "next";
import Link from "next/link";
import { getAccess } from "@/lib/access";
import { giftStatus } from "@/lib/gifts";
import { SiteHeader } from "@/components/SiteHeader";
import { GiftRedeemButton } from "@/components/GiftRedeem";

export const metadata: Metadata = {
  title: "Подарък: Кухнята на Геша",
  description: "Някой ти подари 100+ високопротеинови рецепти с калории и макроси. Влез и ги отключи.",
  robots: { index: false },
};

export default async function GiftPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw).toUpperCase();
  const [access, status] = await Promise.all([getAccess(), giftStatus(code)]);

  return (
    <>
      <SiteHeader />
      <div className="gate">
        <div className="lock-big">🎁</div>
        {status === "ok" && !access.purchasedBook && (
          <>
            <h1 className="display">Имаш подарък</h1>
            <p>
              Някой ти подари „Кухнята на Геша“: 100+ високопротеинови рецепти с
              калории и макроси, дневни менюта и 3 месеца нови рецепти
              безплатно. Влизаш със своя имейл и всичко е твое.
            </p>
            <GiftRedeemButton code={code} signedIn={!!access.email} />
            {access.email && <p className="gift-as">Ще го отключа за {access.email}.</p>}
          </>
        )}
        {status === "ok" && access.purchasedBook && (
          <>
            <h1 className="display">Ти вече имаш книгата</h1>
            <p>Този подарък още е свободен. Препрати линка на някой друг, който ще го оцени.</p>
            <Link className="btn" href="/recipes">
              Към рецептите
            </Link>
          </>
        )}
        {status === "used" && (
          <>
            <h1 className="display">Подаръкът вече е взет</h1>
            <p>Ако ти си го взел, просто влез с имейла си и рецептите са там.</p>
            <Link className="btn" href="/recipes">
              Към рецептите
            </Link>
          </>
        )}
        {status === "missing" && (
          <>
            <h1 className="display">Не намирам този подарък</h1>
            <p>Провери дали линкът е копиран целият. Ако не става, пиши ми на hello@geshapov.com.</p>
          </>
        )}
      </div>
    </>
  );
}
