import { useEffect, useState } from "react";
import api from "../services/api";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api
      .get("/notifications")
      .then((res) => setItems(res.data?.items || []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-800">Centro de Notificaciones</h2>
        <p className="mt-1 text-sm text-slate-500">Recordatorios de pagos, gastos planificados y alertas de seguridad.</p>
      </div>
      <div className="panel p-5">
        <div className="space-y-2">
          {items.length ? items.map((item) => (
            <article key={item.id} className={`rounded-xl border p-3 text-sm ${item.kind === "blocked" ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"}`}>
              <p className="font-semibold text-slate-800">{item.source === "planned_expense" ? "Gasto planificado" : "Pago automático"}</p>
              <p className="text-slate-700">{item.message}</p>
            </article>
          )) : <p className="text-sm text-slate-500">No hay notificaciones por ahora.</p>}
        </div>
      </div>
    </div>
  );
}