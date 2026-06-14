"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

/** Widget de chat du storefront (§13) — bulle + fenêtre, réponses en streaming. */
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [human, setHuman] = useState(false);
  const sessionId = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Config + sessionId
  useEffect(() => {
    let sid = localStorage.getItem("bh_chat_session");
    if (!sid) { sid = crypto.randomUUID(); localStorage.setItem("bh_chat_session", sid); }
    sessionId.current = sid;
    fetch("/api/chat")
      .then((r) => r.json())
      .then((c) => { setEnabled(c.enabled); setGreeting(c.greeting); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId.current, message: text }),
      });
      if (res.headers.get("X-Mode") === "human") setHuman(true);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + chunk };
            return copy;
          });
        }
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: "Désolé, une erreur est survenue. Réessayez." };
        return copy;
      });
    } finally {
      setSending(false);
    }
  }

  if (!enabled) return null;

  return (
    <>
      {/* Bulle */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Ouvrir le chat"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition hover:bg-brand-dark"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Fenêtre */}
      {open ? (
        <div className="fixed bottom-24 right-5 z-50 flex h-[28rem] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border border-line bg-white shadow-2xl">
          <header className="bg-brand px-4 py-3 text-white">
            <div className="font-bold">Assistance</div>
            <div className="text-xs text-white/80">{human ? "Un conseiller vous répond" : "Réponse immédiate"}</div>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-surface p-3">
            {messages.length === 0 ? (
              <div className="rounded-lg bg-white p-2 text-sm text-ink shadow-card">{greeting}</div>
            ) : null}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-lg p-2 text-sm shadow-card ${m.role === "user" ? "bg-brand text-white" : "bg-white text-ink"}`}>
                  {m.content || "…"}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-line p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Votre message…"
              className="flex-1 rounded-md border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <button type="submit" disabled={sending} aria-label="Envoyer" className="btn-brand px-3 py-2"><Send className="h-4 w-4" /></button>
          </form>
        </div>
      ) : null}
    </>
  );
}
