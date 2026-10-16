import { COMMUNITY } from "@/lib/site";

/** For book owners: the way into the Skool community (hidden until the URL is set). */
export function CommunityCard() {
  if (!COMMUNITY.url) return null;
  return (
    <div className="community-card">
      <div>
        <b>{COMMUNITY.name}</b>
        <p>
          Споделяй какво си сготвил, питай за хранене и тренировки и гледай
          видеата ми за здраве и уелнес. Натисни бутона и се присъедини.
        </p>
      </div>
      <a className="btn" href={COMMUNITY.url} target="_blank" rel="noopener noreferrer">
        Влез в общността
      </a>
    </div>
  );
}
