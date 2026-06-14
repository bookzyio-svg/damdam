"use client";

import { useEffect, useState } from "react";
import Stars from "@/components/storefront/Stars";

type Review = {
  _id: string;
  author?: string;
  rating: number;
  title?: string;
  body?: string;
  createdAt?: string;
};

/** Avis clients : liste des avis publiés + formulaire (mise en modération). */
export default function ProductReviews({
  productId,
  ratingAvg = 0,
  reviewCount = 0,
}: {
  productId: string;
  ratingAvg?: number;
  reviewCount?: number;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulaire
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reviews?product=${productId}`)
      .then((r) => r.json())
      .then((b) => setReviews(b.reviews ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product: productId, author, rating, title, body }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b?.error || "Erreur");
      return;
    }
    setSubmitted(true);
    setAuthor(""); setTitle(""); setBody(""); setRating(5);
  }

  return (
    <section id="avis">
      <h2 className="mb-4 text-lg font-bold">Avis clients</h2>

      <div className="mb-6 flex items-center gap-4 rounded-lg border border-line bg-surface p-4">
        <div className="text-center">
          <div className="text-3xl font-extrabold text-ink">{ratingAvg.toFixed(1)}</div>
          <Stars rating={ratingAvg} />
          <div className="mt-1 text-xs text-muted">{reviewCount} avis</div>
        </div>
        <p className="text-sm text-muted">
          Les avis proviennent de clients ayant acheté ce produit. Chaque avis est vérifié avant publication.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Liste */}
        <div>
          {loading ? (
            <p className="text-muted">Chargement des avis…</p>
          ) : reviews.length === 0 ? (
            <p className="text-muted">Aucun avis pour le moment. Soyez le premier !</p>
          ) : (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r._id} className="border-b border-line pb-4">
                  <div className="flex items-center gap-2">
                    <Stars rating={r.rating} />
                    <span className="font-semibold text-ink">{r.title}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink">{r.body}</p>
                  <p className="mt-1 text-xs text-muted">
                    {r.author || "Client"}
                    {r.createdAt ? ` · ${new Date(r.createdAt).toLocaleDateString("fr-FR")}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Formulaire */}
        <div className="rounded-lg border border-line bg-white p-4">
          <h3 className="mb-3 font-bold">Donner mon avis</h3>
          {submitted ? (
            <p className="rounded bg-stock/10 p-3 text-sm font-medium text-stock">
              Merci ! Votre avis a été envoyé et sera publié après vérification.
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div>
                <span className="mb-1 block text-sm font-medium">Note</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button type="button" key={n} onClick={() => setRating(n)} className="text-2xl leading-none" aria-label={`${n} étoiles`}>
                      <span className={n <= rating ? "text-star" : "text-line"}>★</span>
                    </button>
                  ))}
                </div>
              </div>
              <input required value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Votre nom" className="w-full rounded-md border border-line px-3 py-2 text-sm" />
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre (optionnel)" className="w-full rounded-md border border-line px-3 py-2 text-sm" />
              <textarea required value={body} onChange={(e) => setBody(e.target.value)} placeholder="Votre avis…" className="min-h-[100px] w-full rounded-md border border-line px-3 py-2 text-sm" />
              {error ? <p className="text-sm text-deal">{error}</p> : null}
              <button type="submit" disabled={submitting} className="btn-brand w-full">
                {submitting ? "Envoi…" : "Publier mon avis"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
