/** Rendu d'une page légale (contenu issu de settings.legal, avec repli). */
export default function LegalContent({
  title,
  content,
  fallback,
}: {
  title: string;
  content?: string | null;
  fallback: string;
}) {
  const text = content?.trim() || fallback;
  return (
    <div className="container-site max-w-3xl py-10">
      <h1 className="mb-6 text-3xl font-bold">{title}</h1>
      <div className="whitespace-pre-line text-sm leading-relaxed text-ink">{text}</div>
      <p className="mt-10 text-xs text-muted">
        Dernière mise à jour gérée depuis le back-office (Réglages → Légal).
      </p>
    </div>
  );
}
