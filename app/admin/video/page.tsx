import Link from "next/link";
import { getGuideVideo, getIntroVideo } from "@/lib/settings";
import { VideoUpload } from "@/components/VideoUpload";

export default async function AdminVideo() {
  const [video, guide] = await Promise.all([getIntroVideo(), getGuideVideo()]);
  return (
    <section style={{ paddingTop: 32, maxWidth: 720 }}>
      <div className="admin-tabs">
        <Link href="/admin">Рецепти</Link>
        <Link href="/admin/otzivi">Отзиви</Link>
        <Link href="/admin/produkti">Продукти</Link>
        <Link href="/admin/video" className="on">
          Видео
        </Link>
        <Link href="/admin/podaraci">Подаръци</Link>
        <Link href="/admin/imeyli">Имейли</Link>
      </div>
      <h1 className="display" style={{ fontSize: 34, marginBottom: 6 }}>
        Видео на началната страница
      </h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 18, lineHeight: 1.6 }}>
        Излиза веднага под най-горния екран, в секция „Изгледай, преди да
        купиш“. Говори 30–60 секунди: кой си, какво има в книгата и за кого е.
      </p>
      {video && (
        <video src={video.url} poster={video.poster ?? undefined} controls playsInline style={{ width: "100%", maxWidth: 360, borderRadius: 16, marginBottom: 16 }} />
      )}
      <VideoUpload current={video?.url ?? null} />

      <h2 className="display" style={{ fontSize: 28, margin: "40px 0 6px" }}>
        Видео „Как работи“ (след покупка)
      </h2>
      <p style={{ color: "var(--text-dim)", marginBottom: 18, lineHeight: 1.6 }}>
        Излиза на страницата <Link href="/kak-raboti">/kak-raboti</Link>. Към нея водят
        имейлът след покупка и рецептите. Покажи с екрана на телефона: търсене и
        филтри, порции, „Готвя“, списък, меню по калории, калкулатор, бонуса и групата.
      </p>
      {guide && (
        <video src={guide.url} poster={guide.poster ?? undefined} controls playsInline style={{ width: "100%", maxWidth: 360, borderRadius: 16, marginBottom: 16 }} />
      )}
      <VideoUpload current={guide?.url ?? null} target="guide" />
    </section>
  );
}
