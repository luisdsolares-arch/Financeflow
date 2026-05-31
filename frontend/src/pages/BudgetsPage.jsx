import { useState } from "react";
import api from "../services/api";

export default function BudgetsPage() {
  const [form, setForm] = useState({ category: "Comida", limit_amount: 300, month_year: new Date().toISOString().slice(0, 7) });
  const [status, setStatus] = useState("");

  const saveBudget = async (event) => {
    event.preventDefault();
    setStatus("");

    if (!form.category.trim()) {
      setStatus("La categoría es obligatoria.");
      return;
    }

    try {
      await api.post("/budgets", form);
      setStatus("Presupuesto creado correctamente.");
    } catch (error) {
      const detail = error?.response?.data?.detail;
      if (typeof detail === "string" && detail.trim()) {
        setStatus(`No se pudo crear el presupuesto: ${detail}`);
        return;
      }
      setStatus("No se pudo crear el presupuesto.");
    }
  };

  return (
    <div className="panel p-5">
      <h2 className="text-lg font-semibold text-slate-800">Presupuestos Mensuales</h2>
      <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={saveBudget}>
        <input className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Categoría" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
        <input className="rounded-xl border border-slate-200 px-3 py-2" type="number" min="1" step="0.01" value={form.limit_amount} onChange={(e) => setForm((p) => ({ ...p, limit_amount: Number(e.target.value) }))} />
        <input className="rounded-xl border border-slate-200 px-3 py-2" type="month" value={form.month_year} onChange={(e) => setForm((p) => ({ ...p, month_year: e.target.value }))} />
        <button className="rounded-xl bg-slate-900 px-4 py-2 text-white">Guardar</button>
      </form>
      {status ? <p className="mt-3 text-sm text-slate-600">{status}</p> : null}
    </div>
  );
}
