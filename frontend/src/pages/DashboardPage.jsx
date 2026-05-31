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
import { fallbackSummary } from "../data/mock";
import api from "../services/api";
import { formatCurrency } from "../services/currency";

const palette = ["#0F172A", "#10B981", "#EF4444", "#334155", "#94A3B8"];

export default function DashboardPage() {
  const [summary, setSummary] = useState(fallbackSummary);

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(fallbackSummary));
  }, []);

  const categoryData = Object.entries(summary.expenses_by_category || {}).map(([name, value]) => ({ name, value }));
  const timelineData = [
    { month: "Ene", balance: 9200 },
    { month: "Feb", balance: 9800 },
    { month: "Mar", balance: 10600 },
    { month: "Abr", balance: 12100 },
    { month: "May", balance: summary.net_balance },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Balance Total Neto" value={formatCurrency(summary.net_balance)} />
        <KpiCard label="Ingresos del Mes" value={formatCurrency(summary.monthly_income)} tone="success" />
        <KpiCard label="Gastos del Mes" value={formatCurrency(summary.monthly_expenses)} tone="danger" />
        <KpiCard label="Capacidad de Ahorro" value={`${summary.saving_capacity_pct}%`} hint="Objetivo recomendado >= 20%" />
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
