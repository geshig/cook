import { COMMUNITY } from "@/lib/site";

/** For book owners: the way into the Facebook group (hidden until the URL is set). */
export function CommunityCard() {
  if (!COMMUNITY.url) return null;
  return (
    <div className="community-card">
      <div>
        <b>{COMMUNITY.name}</b>
        <p>
          Покажи какво си сготвил, питай за замени и хранене и гледай
          съветите ми за здраве и тренировки. Аз съм вътре и отговарям лично.
        </p>
      </div>
      <a className="btn" href={COMMUNITY.url} target="_blank" rel="noopener noreferrer">
        Влез в групата
      </a>
    </div>
  );
}
