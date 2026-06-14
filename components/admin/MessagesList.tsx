"use client";

import { useEffect, useState } from "react";

type Message = {
  _id: string;
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  handled?: boolean;
  createdAt?: string;
};

export default function MessagesList() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/contact");
    const body = await res.json();
    setMessages(body.messages ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggleHandled(id: string, handled: boolean) {
    const res = await fetch(`/api/contact/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handled }),
    });
    if (res.ok) setMessages((m) => m.map((x) => (x._id === id ? { ...x, handled } : x)));
  }
  async function remove(id: string) {
    if (!confirm("Supprimer ce message ?")) return;
    const res = await fetch(`/api/contact/${id}`, { method: "DELETE" });
    if (res.ok) setMessages((m) => m.filter((x) => x._id !== id));
  }

  if (loading) return <p className="p-6 text-center text-muted">Chargement…</p>;
  if (messages.length === 0) return <p className="rounded-xl border border-line bg-white p-8 text-center text-sm text-muted shadow-sm">Aucun message.</p>;

  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <div key={m._id} className={`rounded-xl border bg-white p-4 shadow-sm ${m.handled ? "border-line opacity-70" : "border-brand/30"}`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-semibold text-ink">{m.subject || "(sans sujet)"}</div>
              <div className="text-xs text-muted">
                {m.name} · <a href={`mailto:${m.email}`} className="text-brand hover:underline">{m.email}</a>
                {m.createdAt ? ` · ${new Date(m.createdAt).toLocaleString("fr-FR")}` : ""}
              </div>
            </div>
            {m.handled ? <span className="rounded bg-stock/15 px-2 py-0.5 text-xs font-medium text-stock">Traité</span> : <span className="rounded bg-deal-soft px-2 py-0.5 text-xs font-medium text-deal">Nouveau</span>}
          </div>
          <p className="mt-2 whitespace-pre-line text-sm text-ink">{m.message}</p>
          <div className="mt-3 flex gap-3 border-t border-line pt-2 text-sm">
            <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || "")}`} className="font-medium text-brand hover:underline">Répondre</a>
            <button onClick={() => toggleHandled(m._id, !m.handled)} className="font-medium text-muted hover:text-ink">{m.handled ? "Marquer non traité" : "Marquer traité"}</button>
            <button onClick={() => remove(m._id)} className="ml-auto font-medium text-deal hover:underline">Supprimer</button>
          </div>
        </div>
      ))}
    </div>
  );
}
