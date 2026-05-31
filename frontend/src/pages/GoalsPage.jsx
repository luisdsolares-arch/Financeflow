import { useEffect, useState } from "react";
import api from "../services/api";
import { formatCurrency } from "../services/currency";

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    title: "Fondo de emergencia",
    target_amount: 5000,
    current_amount: 500,
    target_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString().slice(0, 10),
    priority: "high",
  });

  const loadGoals = async () => {
    try {
      const { data } = await api.get("/goals");
      setGoals(data || []);
    } catch {
      setGoals([]);
      setStatus("No se pudieron cargar las metas.");
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const createGoal = async (event) => {
    event.preventDefault();
    setStatus("");
    try {
      await api.post("/goals", {
        ...form,
        target_amount: Number(form.target_amount),
        current_amount: Number(form.current_amount),
      });
      setStatus("Meta creada correctamente.");
      loadGoals();
    } catch (error) {
      const detail = error?.response?.data?.detail;
      setStatus(typeof detail === "string" ? detail : "No se pudo crear la meta.");
    }
  };

  const closeGoal = async (goal) => {
    try {
      await api.patch(`/goals/${goal.id}`, { current_amount: goal.current_amount, is_active: false });
      loadGoals();
    } catch {
      setStatus("No se pudo cerrar la meta.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-800">Metas Financieras</h2>
        <p className="mt-1 text-sm text-slate-500">Define objetivos y cuánto debes separar cada mes para alcanzarlos.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <form className="panel space-y-3 p-5" onSubmit={createGoal}>
          <h3 className="text-sm font-semibold text-slate-700">Nueva Meta</h3>
          <input className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Título" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
          <input className="w-full rounded-xl border border-slate-200 px-3 py-2" type="number" min="1" step="0.01" placeholder="Monto objetivo" value={form.target_amount} onChange={(event) => setForm((prev) => ({ ...prev, target_amount: event.target.value }))} />
          <input className="w-full rounded-xl border border-slate-200 px-3 py-2" type="number" min="0" step="0.01" placeholder="Monto actual" value={form.current_amount} onChange={(event) => setForm((prev) => ({ ...prev, current_amount: event.target.value }))} />
          <input className="w-full rounded-xl border border-slate-200 px-3 py-2" type="date" value={form.target_date} onChange={(event) => setForm((prev) => ({ ...prev, target_date: event.target.value }))} />
          <select className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.priority} onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}>
            <option value="high">Alta prioridad</option>
            <option value="medium">Media prioridad</option>
            <option value="low">Baja prioridad</option>
          </select>
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Guardar meta</button>
          {status ? <p className="text-sm text-slate-600">{status}</p> : null}
        </form>

        <div className="panel p-5">
          <h3 className="text-sm font-semibold text-slate-700">Progreso de Metas</h3>
          <div className="mt-3 space-y-3">
            {goals.length ? goals.map((goal) => (
              <article key={goal.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{goal.title}</p>
                    <p className="text-xs text-slate-500">Meta: {goal.target_date} · prioridad {goal.priority}</p>
                  </div>
                  {!goal.is_active ? <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">Cerrada</span> : null}
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(goal.progress_pct, 100)}%` }} />
                </div>
                <div className="mt-2 grid gap-1 text-xs text-slate-600 md:grid-cols-2">
                  <p>Actual: <span className="font-semibold text-slate-800">{formatCurrency(goal.current_amount)}</span></p>
                  <p>Objetivo: <span className="font-semibold text-slate-800">{formatCurrency(goal.target_amount)}</span></p>
                  <p>Avance: <span className="font-semibold text-emerald-700">{goal.progress_pct}%</span></p>
                  <p>Recomendado/mes: <span className="font-semibold text-emerald-700">{formatCurrency(goal.monthly_required)}</span></p>
                </div>
                {goal.is_active ? (
                  <div className="mt-2 flex justify-end">
                    <button onClick={() => closeGoal(goal)} className="rounded-xl border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">Cerrar meta</button>
                  </div>
                ) : null}
              </article>
            )) : <p className="text-sm text-slate-500">Aún no hay metas creadas.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}