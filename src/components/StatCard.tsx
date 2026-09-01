export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-xs tracking-[0.16em] uppercase text-[var(--muted)]">{label}</p>
      <p className="text-3xl font-semibold mt-2">{value}</p>
      {hint ? <p className="text-sm text-[var(--muted)] mt-1">{hint}</p> : null}
    </div>
  );
}
