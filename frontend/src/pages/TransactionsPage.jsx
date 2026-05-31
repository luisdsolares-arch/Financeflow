import { useEffect, useState } from "react";
import api from "../services/api";
import { formatCurrency } from "../services/currency";

export default function TransactionsPage() {
  const [rows, setRows] = useState([]);
  const [plannedExpenses, setPlannedExpenses] = useState([]);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    description: "Seguro del coche",
    category: "Transporte",
    amount: 250,
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
    recurrence_type: "one_time",
    planning_mode: "monthly",
    reminder_days_before: 7,
  });

  const loadData = async () => {
    try {
      const [transactionsResponse, plannedResponse] = await Promise.all([
        api.get("/transactions"),
        api.get("/transactions/planned"),
      ]);
      setRows(transactionsResponse.data || []);
      setPlannedExpenses(plannedResponse.data || []);
    } catch {
      setRows([]);
      setPlannedExpenses([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const savePlannedExpense = async (event) => {
    event.preventDefault();
    setStatus("");

    try {
      const { data } = await api.post("/transactions/planned", {
        ...form,
        amount: Number(form.amount),
        reminder_days_before: Number(form.reminder_days_before),
      });
      setStatus(
        `Gasto ${data.recurrence_type === "one_time" ? "puntual" : "recurrente"} guardado. Reserva ${
          data.planning_mode === "weekly" ? formatCurrency(data.recommended_weekly_saving) + " por semana" : formatCurrency(data.recommended_monthly_saving) + " por mes"
        } hasta ${data.due_date}.`
      );
      setForm((prev) => ({
        ...prev,
        amount: 250,
        due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
      }));
      loadData();
    } catch (error) {
      const detail = error?.response?.data?.detail;
      setStatus(typeof detail === "string" && detail.trim() ? detail : "No se pudo guardar el gasto planificado.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-800">Transacciones</h2>
        <p className="mt-1 text-sm text-slate-500">Registra gastos puntuales o recurrentes y prepara el dinero antes de la fecha de pago.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <form className="panel space-y-4 p-5" onSubmit={savePlannedExpense}>
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Planificar gasto</h3>
            <p className="mt-1 text-sm text-slate-500">Elige si el gasto es puntual o recurrente. La app te dirá cuánto reservar cada semana o mes.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm text-slate-600 md:col-span-2">
              Descripción
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
            </label>

            <label className="block text-sm text-slate-600">
              Categoría
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} />
            </label>

            <label className="block text-sm text-slate-600">
              Importe
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} />
            </label>

            <label className="block text-sm text-slate-600">
              Tipo de gasto
              <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={form.recurrence_type} onChange={(event) => setForm((prev) => ({ ...prev, recurrence_type: event.target.value }))}>
                <option value="one_time">Puntual</option>
                <option value="weekly">Recurrente semanal</option>
                <option value="monthly">Recurrente mensual</option>
              </select>
            </label>

            <label className="block text-sm text-slate-600">
              Fecha del próximo pago
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="date" value={form.due_date} onChange={(event) => setForm((prev) => ({ ...prev, due_date: event.target.value }))} />
            </label>

            <label className="block text-sm text-slate-600">
              Plan de ahorro
              <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={form.planning_mode} onChange={(event) => setForm((prev) => ({ ...prev, planning_mode: event.target.value }))}>
                <option value="weekly">Separar cada semana</option>
                <option value="monthly">Separar cada mes</option>
              </select>
            </label>

            <label className="block text-sm text-slate-600">
              Recordarme con antelación (días)
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="number" min="1" max="60" value={form.reminder_days_before} onChange={(event) => setForm((prev) => ({ ...prev, reminder_days_before: event.target.value }))} />
            </label>
          </div>

          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Guardar gasto planificado</button>
          {status ? <p className="text-sm text-slate-600">{status}</p> : null}
        </form>

        <div className="panel p-5">
          <h3 className="text-sm font-semibold text-slate-700">Recordatorios y planificación</h3>
          <div className="mt-3 space-y-3">
            {plannedExpenses.length ? plannedExpenses.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{item.description}</p>
                    <p className="text-sm text-slate-500">{item.category} · {item.recurrence_type === "one_time" ? "Puntual" : item.recurrence_type === "weekly" ? "Recurrente semanal" : "Recurrente mensual"}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{formatCurrency(item.amount)}</span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                  <p>Próximo pago: <span className="font-semibold text-slate-800">{item.due_date}</span></p>
                  <p>Faltan: <span className="font-semibold text-slate-800">{item.days_until_due} día(s)</span></p>
                  <p>Reserva semanal: <span className="font-semibold text-emerald-700">{formatCurrency(item.recommended_weekly_saving)}</span></p>
                  <p>Reserva mensual: <span className="font-semibold text-emerald-700">{formatCurrency(item.recommended_monthly_saving)}</span></p>
                </div>
              </article>
            )) : <p className="text-sm text-slate-500">Aún no tienes gastos planificados. Crea uno para recibir un recordatorio y una meta de ahorro.</p>}
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="text-sm font-semibold text-slate-700">Historial de movimientos</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2">Fecha</th>
                <th className="pb-2">Descripcion</th>
                <th className="pb-2">Categoria</th>
                <th className="pb-2">Tipo</th>
                <th className="pb-2 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="py-2">{row.date}</td>
                  <td>{row.description}</td>
                  <td>{row.category}</td>
                  <td>{row.type}</td>
                  <td className="text-right">{formatCurrency(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
