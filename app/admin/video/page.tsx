import Link from "next/link";
import { getIntroVideo } from "@/lib/settings";
import { VideoUpload } from "@/components/VideoUpload";

export default async function AdminVideo() {
  const video = await getIntroVideo();
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
    </section>
  );
}
