import { useEffect, useState } from "react";
import api from "../services/api";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);

  const loadNotifications = () => {
    api
      .get("/notifications")
      .then((res) => setItems(res.data?.items || []))
      .catch(() => setItems([]));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const toggleRead = async (item) => {
    try {
      await api.patch(`/notifications/${item.id}`, { is_read: !item.is_read });
      loadNotifications();
    } catch {
      // Ignore action failures to keep list visible.
    }
  };

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
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">{item.source === "planned_expense" ? "Gasto planificado" : "Pago automático"}</p>
                  <p className="text-slate-700">{item.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleRead(item)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${item.is_read ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-700"}`}
                >
                  {item.is_read ? "Marcar no leída" : "Marcar leída"}
                </button>
              </div>
            </article>
          )) : <p className="text-sm text-slate-500">No hay notificaciones por ahora.</p>}
        </div>
      </div>
    </div>
  );
}