export default function Flash({ sp }: { sp: { ok?: string; viga?: string } }) {
  if (sp.viga) return <p className="banner info error" role="alert">{sp.viga}</p>;
  if (sp.ok) return <p className="banner info ok" role="status">✓ {sp.ok}</p>;
  return null;
}
