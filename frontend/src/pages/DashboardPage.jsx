import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import KpiCard from "../components/KpiCard";
import api from "../services/api";
import { formatCurrency } from "../services/currency";

const palette = ["#0F172A", "#10B981", "#EF4444", "#334155", "#94A3B8"];
const DASHBOARD_SUMMARY_CACHE_KEY = "financeflow.dashboard.summary.v1";

const emptySummary = {
  net_balance: 0,
  monthly_income: 0,
  monthly_expenses: 0,
  saving_capacity_pct: 0,
  projected_monthly_reserve: 0,
  expenses_by_category: {},
  recent_transactions: [],
  upcoming_planned_expenses: [],
};

const readCachedSummary = () => {
  try {
    const raw = localStorage.getItem(DASHBOARD_SUMMARY_CACHE_KEY);
    if (!raw) {
      return emptySummary;
    }
    const parsed = JSON.parse(raw);
    return {
      ...emptySummary,
      ...parsed,
      expenses_by_category: parsed?.expenses_by_category || {},
      recent_transactions: Array.isArray(parsed?.recent_transactions) ? parsed.recent_transactions : [],
      upcoming_planned_expenses: Array.isArray(parsed?.upcoming_planned_expenses) ? parsed.upcoming_planned_expenses : [],
    };
  } catch {
    return emptySummary;
  }
};

const parseIsoDate = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
};

const buildCalendarCells = (year, month, eventMap) => {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekdayMondayFirst = (first.getDay() + 6) % 7;

  const cells = [];
  for (let index = 0; index < firstWeekdayMondayFirst; index += 1) {
    cells.push({ key: `empty-${index}`, day: null, items: [] });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ key: `day-${day}`, day, items: eventMap[day] || [] });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: `tail-${cells.length}`, day: null, items: [] });
  }

  return cells;
};

const monthLabels = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const weekdayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function DashboardPage() {
  const [summary, setSummary] = useState(() => readCachedSummary());
  const [goals, setGoals] = useState([]);
  const [plannedItems, setPlannedItems] = useState([]);
  const [whatIf, setWhatIf] = useState({ incomeDeltaPct: 0, expensesDeltaPct: 0 });
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then((res) => {
        const next = { ...emptySummary, ...res.data };
        setSummary(next);
        localStorage.setItem(DASHBOARD_SUMMARY_CACHE_KEY, JSON.stringify(next));
      })
      .catch(() => {
        setSummary(readCachedSummary());
      });

    api
      .get("/goals")
      .then((res) => setGoals(res.data || []))
      .catch(() => setGoals([]));

    api
      .get("/transactions/planned")
      .then((res) => setPlannedItems(res.data || []))
      .catch(() => setPlannedItems([]));
  }, []);

  const categoryData = Object.entries(summary.expenses_by_category || {}).map(([name, value]) => ({ name, value }));
  const timelineData = [
    { month: "Ene", balance: 9200 },
    { month: "Feb", balance: 9800 },
    { month: "Mar", balance: 10600 },
    { month: "Abr", balance: 12100 },
    { month: "May", balance: summary.net_balance },
  ];

  const simulatedIncome = summary.monthly_income * (1 + Number(whatIf.incomeDeltaPct || 0) / 100);
  const simulatedExpenses = summary.monthly_expenses * (1 + Number(whatIf.expensesDeltaPct || 0) / 100);
  const simulatedCapacity = simulatedIncome > 0 ? (((simulatedIncome - simulatedExpenses) / simulatedIncome) * 100) : 0;

  const eventsByDay = {};
  plannedItems.forEach((item) => {
    const parsed = parseIsoDate(item.due_date);
    if (!parsed || parsed.getFullYear() !== calendarDate.year || parsed.getMonth() !== calendarDate.month) {
      return;
    }
    const day = parsed.getDate();
    eventsByDay[day] = eventsByDay[day] || [];
    eventsByDay[day].push({
      type: "expense",
      label: item.description,
      amount: item.amount,
    });
  });

  goals.forEach((goal) => {
    const parsed = parseIsoDate(goal.target_date);
    if (!parsed || parsed.getFullYear() !== calendarDate.year || parsed.getMonth() !== calendarDate.month) {
      return;
    }
    const day = parsed.getDate();
    eventsByDay[day] = eventsByDay[day] || [];
    eventsByDay[day].push({
      type: "goal",
      label: `Meta: ${goal.title}`,
      amount: goal.monthly_required,
    });
  });

  const calendarCells = buildCalendarCells(calendarDate.year, calendarDate.month, eventsByDay);

  const moveCalendarMonth = (step) => {
    setCalendarDate((prev) => {
      const nextDate = new Date(prev.year, prev.month + step, 1);
      return { year: nextDate.getFullYear(), month: nextDate.getMonth() };
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Balance Total Neto" value={formatCurrency(summary.net_balance)} />
        <KpiCard label="Ingresos del Mes" value={formatCurrency(summary.monthly_income)} tone="success" />
        <KpiCard label="Gastos del Mes" value={formatCurrency(summary.monthly_expenses)} tone="danger" />
        <KpiCard
          label="Capacidad de Ahorro"
          value={`${summary.saving_capacity_pct}%`}
          hint={`Reserva sugerida mensual: ${formatCurrency(summary.projected_monthly_reserve || 0)}`}
        />
      </div>

      <div className="panel p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-700">Próximos Gastos Planificados</h2>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Reserva mensual sugerida: {formatCurrency(summary.projected_monthly_reserve || 0)}
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {summary.upcoming_planned_expenses?.length ? (
            summary.upcoming_planned_expenses.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{item.description}</p>
                    <p className="text-slate-500">{item.category} · vence {item.due_date} · faltan {item.days_until_due} día(s)</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{formatCurrency(item.amount)}</span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Reserva recomendada: {formatCurrency(item.recommended_weekly_saving)} por semana o {formatCurrency(item.recommended_monthly_saving)} por mes
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-500">No hay gastos próximos que requieran alerta por ahora.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="panel p-5 xl:col-span-2">
          <h2 className="text-sm font-semibold text-slate-700">Evolucion del Balance</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="balance" stroke="#0F172A" fill="#0F172A" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-slate-700">Gastos por Categoria</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95}>
                  {categoryData.map((entry, index) => (
                    <Cell key={entry.name} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="panel p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Simulador "Qué pasa si"</h2>
          <label className="block text-sm text-slate-600">
            Variación de ingresos (%)
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="number" value={whatIf.incomeDeltaPct} onChange={(event) => setWhatIf((prev) => ({ ...prev, incomeDeltaPct: event.target.value }))} />
          </label>
          <label className="block text-sm text-slate-600">
            Variación de gastos (%)
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="number" value={whatIf.expensesDeltaPct} onChange={(event) => setWhatIf((prev) => ({ ...prev, expensesDeltaPct: event.target.value }))} />
          </label>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p>Ingreso simulado: <span className="font-semibold">{formatCurrency(simulatedIncome)}</span></p>
            <p>Gasto simulado: <span className="font-semibold">{formatCurrency(simulatedExpenses)}</span></p>
            <p>Capacidad de ahorro simulada: <span className="font-semibold text-emerald-700">{simulatedCapacity.toFixed(2)}%</span></p>
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-slate-700">Progreso de Metas</h2>
          <div className="mt-3 space-y-2">
            {goals.length ? goals.slice(0, 4).map((goal) => (
              <article key={goal.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-800">{goal.title}</p>
                  <span className="text-xs font-semibold text-slate-600">{goal.progress_pct}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(goal.progress_pct, 100)}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-500">Meta {goal.target_date} · recomendado/mes {formatCurrency(goal.monthly_required)}</p>
              </article>
            )) : <p className="text-sm text-slate-500">Sin metas aún. Crea una en la pestaña Metas.</p>}
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-700">Calendario Financiero</h2>
          <div className="flex items-center gap-2 text-sm">
            <button type="button" onClick={() => moveCalendarMonth(-1)} className="rounded-lg border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-100">Anterior</button>
            <span className="min-w-40 text-center font-semibold text-slate-700">{monthLabels[calendarDate.month]} {calendarDate.year}</span>
            <button type="button" onClick={() => moveCalendarMonth(1)} className="rounded-lg border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-100">Siguiente</button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
          {weekdayLabels.map((weekday) => (
            <div key={weekday}>{weekday}</div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {calendarCells.map((cell) => (
            <article key={cell.key} className={`min-h-24 rounded-xl border p-2 ${cell.day ? "border-slate-200 bg-white" : "border-transparent bg-transparent"}`}>
              {cell.day ? (
                <>
                  <p className="text-xs font-semibold text-slate-600">{cell.day}</p>
                  <div className="mt-1 space-y-1">
                    {cell.items.slice(0, 2).map((entry) => (
                      <div key={`${cell.key}-${entry.label}`} className={`rounded px-1.5 py-0.5 text-[10px] ${entry.type === "goal" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"}`}>
                        <p className="truncate">{entry.label}</p>
                        <p className="truncate font-semibold">{formatCurrency(entry.amount || 0)}</p>
                      </div>
                    ))}
                    {cell.items.length > 2 ? <p className="text-[10px] text-slate-500">+{cell.items.length - 2} evento(s)</p> : null}
                  </div>
                </>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      <div className="panel overflow-x-auto p-5">
        <h2 className="text-sm font-semibold text-slate-700">Ultimas Transacciones</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-2">Fecha</th>
              <th className="pb-2">Concepto</th>
              <th className="pb-2">Categoria</th>
              <th className="pb-2">Tipo</th>
              <th className="pb-2 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {summary.recent_transactions?.map((item) => (
              <tr key={`${item.date}-${item.concept}`} className="border-b border-slate-100">
                <td className="py-3">{item.date}</td>
                <td>{item.concept}</td>
                <td>{item.category}</td>
                <td>
                  <span className={`rounded-full px-2 py-1 text-xs ${item.type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {item.type === "income" ? "Ingreso" : "Gasto"}
                  </span>
                </td>
                <td className="text-right font-medium">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
