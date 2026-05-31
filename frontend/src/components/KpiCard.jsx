export default function KpiCard({ label, value, tone = "default", hint }) {
  const toneClasses = {
    default: "text-slate-900",
    success: "text-emerald-600",
    danger: "text-rose-600",
  };

  return (
    <div className="kpi-card">
      <p className="text-xs text-slate-500 sm:text-sm">{label}</p>
      <h3 className={`mt-1.5 text-xl font-semibold sm:mt-2 sm:text-2xl lg:text-[1.75rem] ${toneClasses[tone]}`}>{value}</h3>
      {hint ? <p className="mt-1.5 text-[11px] text-slate-400 sm:mt-2 sm:text-xs">{hint}</p> : null}
    </div>
  );
}
