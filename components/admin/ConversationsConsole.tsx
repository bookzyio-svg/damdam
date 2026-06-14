"use client";

import { useCallback, useEffect, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type ConvSummary = {
  _id: string; sessionId: string; customerEmail?: string; mode: string; status: string;
  unread: boolean; lastMessage: string; messageCount: number; updatedAt: string;
};

export default function ConversationsConsole() {
  const [list, setList] = useState<ConvSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [conv, setConv] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    const res = await fetch("/api/conversations");
    const body = await res.json();
    setList(body.conversations ?? []);
  }, []);

  useEffect(() => {
    loadList();
    const t = setInterval(loadList, 15000); // rafraîchit pour les nouveaux messages
    return () => clearInterval(t);
  }, [loadList]);

  async function open(id: string) {
    setActiveId(id);
    const res = await fetch(`/api/conversations/${id}`);
    const body = await res.json();
    setConv(body.conversation);
    loadList();
  }

  async function sendReply() {
    if (!reply.trim() || !activeId) return;
    setBusy(true);
    const res = await fetch(`/api/conversations/${activeId}/reply`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply.trim() }),
    });
    const body = await res.json();
    setBusy(false);
    if (res.ok) { setConv(body.conversation); setReply(""); loadList(); }
  }

  async function setModeStatus(patch: { mode?: string; status?: string }) {
    if (!activeId) return;
    const res = await fetch(`/api/conversations/${activeId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
    });
    const body = await res.json();
    if (res.ok) { setConv(body.conversation); loadList(); }
  }

  return (
    <div className="grid h-[calc(100vh-12rem)] grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
      {/* Liste */}
      <div className="overflow-y-auto rounded-lg border border-line bg-white">
        {list.length === 0 ? (
          <p className="p-4 text-sm text-muted">Aucune conversation.</p>
        ) : (
          list.map((c) => (
            <button
              key={c._id}
              onClick={() => open(c._id)}
              className={`block w-full border-b border-line px-4 py-3 text-left hover:bg-surface ${activeId === c._id ? "bg-surface" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">{c.customerEmail || "Visiteur"}</span>
                <span className="flex items-center gap-1">
                  {c.unread ? <span className="h-2 w-2 rounded-full bg-deal" /> : null}
                  {c.mode === "human" ? <span className="rounded bg-deal-soft px-1 text-[10px] text-deal">humain</span> : null}
                </span>
              </div>
              <div className="truncate text-xs text-muted">{c.lastMessage}</div>
            </button>
          ))
        )}
      </div>

      {/* Détail */}
      <div className="flex flex-col rounded-lg border border-line bg-white">
        {!conv ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted">Sélectionnez une conversation.</div>
        ) : (
          <>
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-3">
              <div className="text-sm">
                <span className="font-semibold">{conv.customerEmail || "Visiteur"}</span>
                <span className="ml-2 rounded bg-surface px-1.5 py-0.5 text-xs">{conv.mode}</span>
                <span className="ml-1 rounded bg-surface px-1.5 py-0.5 text-xs">{conv.status}</span>
              </div>
              <div className="flex gap-2 text-sm">
                {conv.mode === "bot" ? (
                  <button onClick={() => setModeStatus({ mode: "human" })} className="btn-outline px-2 py-1 text-xs">Reprendre la main</button>
                ) : (
                  <button onClick={() => setModeStatus({ mode: "bot" })} className="btn-outline px-2 py-1 text-xs">Rendre au bot</button>
                )}
                {conv.status === "open" ? (
                  <button onClick={() => setModeStatus({ status: "closed" })} className="btn-outline px-2 py-1 text-xs">Clôturer</button>
                ) : (
                  <button onClick={() => setModeStatus({ status: "open" })} className="btn-outline px-2 py-1 text-xs">Rouvrir</button>
                )}
              </div>
            </header>

            <div className="flex-1 space-y-2 overflow-y-auto bg-surface p-3">
              {conv.messages?.map((m: any, i: number) => (
                <div key={i} className={m.role === "user" ? "flex justify-start" : "flex justify-end"}>
                  <div className={`max-w-[80%] whitespace-pre-wrap rounded-lg p-2 text-sm shadow-card ${m.role === "user" ? "bg-white text-ink" : "bg-brand text-white"}`}>
                    {m.content}
                    <div className={`mt-0.5 text-[10px] ${m.role === "user" ? "text-muted" : "text-white/70"}`}>
                      {m.role === "user" ? "Client" : "Boutique"} · {m.at ? new Date(m.at).toLocaleTimeString("fr-FR") : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); sendReply(); }} className="flex gap-2 border-t border-line p-2">
              <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Répondre en tant que conseiller…" className="flex-1 rounded-md border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none" />
              <button type="submit" disabled={busy} className="btn-brand px-3 py-2 text-sm">Envoyer</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
