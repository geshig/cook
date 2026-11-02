"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
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
          <Image src="/homie-avatar.jpg" alt="" width={34} height={34} className="chat-fab-av" unoptimized loading="eager" />
          Питай Хоуми
        </button>
      )}
      {open && (
        <div className="chat-panel" role="dialog" aria-label="Питай Хоуми за книгата">
          <div className="chat-head">
            <Image src="/homie-avatar.jpg" alt="Хоуми" width={42} height={42} className="chat-av" unoptimized loading="eager" />
            <div className="chat-head-t">
              <b>Хоуми 🐾</b>
              <span>AI помощник · отговаря веднага</span>
            </div>
            <button type="button" className="chat-x" onClick={() => setOpen(false)} aria-label="Затвори">
              ×
            </button>
          </div>
          <div className="chat-list" ref={listRef}>
            <p className="chat-msg bot">
              Бау! 🐶 Аз съм Хоуми, кучето на Геша (и AI помощникът на сайта). Опитвам всяка рецепта първи, така че питай ме каквото искаш за книгата.
            </p>
            {msgs.map((m, i) => (
              <p key={i} className={"chat-msg " + (m.role === "user" ? "me" : "bot")}>
                {m.content}
              </p>
            ))}
            {busy && <p className="chat-msg bot chat-typing">Хоуми пише 🐾</p>}
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
                placeholder="Напиши на Хоуми…"
                maxLength={500}
                enterKeyHint="send"
              />
              <button type="submit" disabled={busy || !text.trim()} aria-label="Изпрати">
                ➤
              </button>
            </form>
          ) : (
            <p className="chat-limit">Хоуми отиде да спи 😴 За още въпроси пиши на hello@geshapov.com</p>
          )}
        </div>
      )}
    </>
  );
}
