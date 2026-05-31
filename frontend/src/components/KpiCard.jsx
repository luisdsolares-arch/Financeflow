export default function KpiCard({ label, value, tone = "default", hint }) {
  const toneClasses = {
    default: "text-slate-900",
    success: "text-emerald-600",
    danger: "text-rose-600",
  };

  return (
    <div className="kpi-card">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className={`mt-2 text-2xl font-semibold ${toneClasses[tone]}`}>{value}</h3>
      {hint ? <p className="mt-2 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}
