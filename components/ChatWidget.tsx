"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { track } from "@/lib/track";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Какво точно има вътре?",
  "Става ли за отслабване?",
  "Как получавам достъп?",
  "Има ли вегетариански рецепти?",
];

/**
 * "💬 Питай ме" on the landing page: a floating button that opens a small
 * chat with the site's AI helper (/api/chat). Clearly labelled as AI.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  // The button appears after the first screen, so it never covers the video.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const on = () => setShown(window.scrollY > 450);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: question }];
    setMsgs(next);
    setText("");
    setBusy(true);
    track("Чат: въпрос", { въпрос: question.slice(0, 80) });
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      setMsgs([...next, { role: "assistant", content: data.reply ?? data.error ?? "Нещо се обърка. Пиши на hello@geshapov.com." }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "Нещо се обърка. Пиши на hello@geshapov.com." }]);
    }
    setBusy(false);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    ask(text);
  }

  const asked = msgs.filter((m) => m.role === "user").length;

  return (
    <>
      {!open && shown && (
        <button
          type="button"
          className="chat-fab"
          onClick={() => {
            setOpen(true);
            track("Чат: отворен");
          }}
        >
          💬 Питай ме
        </button>
      )}
      {open && (
        <div className="chat-panel" role="dialog" aria-label="Въпроси за книгата">
          <div className="chat-head">
            <div>
              <b>Въпроси за книгата</b>
              <span>AI помощник · отговаря веднага</span>
            </div>
            <button type="button" className="chat-x" onClick={() => setOpen(false)} aria-label="Затвори">
              ×
            </button>
          </div>
          <div className="chat-list" ref={listRef}>
            <p className="chat-msg bot">
              Здравей! 👋 Питай ме каквото искаш за книгата: какво има вътре, за кого е, как се получава.
            </p>
            {msgs.map((m, i) => (
              <p key={i} className={"chat-msg " + (m.role === "user" ? "me" : "bot")}>
                {m.content}
              </p>
            ))}
            {busy && <p className="chat-msg bot chat-typing">…</p>}
            {asked === 0 && (
              <div className="chat-sugg">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => ask(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          {asked < 12 ? (
            <form className="chat-form" onSubmit={submit}>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Напиши въпрос…"
                maxLength={500}
                enterKeyHint="send"
              />
              <button type="submit" disabled={busy || !text.trim()} aria-label="Изпрати">
                ➤
              </button>
            </form>
          ) : (
            <p className="chat-limit">За още въпроси пиши на hello@geshapov.com 🙂</p>
          )}
        </div>
      )}
    </>
  );
}
