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

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}`, { is_read: true });
      setItems((prev) => prev.map((item) => (item.id === notificationId ? { ...item, is_read: true } : item)));
    } catch {
      loadNotifications();
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
            <article key={item.id} className={`rounded-xl border p-3 text-sm ${item.is_read ? "border-slate-200 bg-slate-50" : item.kind === "blocked" ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-800">{item.source === "planned_expense" ? "Gasto planificado" : "Pago automático"}</p>
                {!item.is_read ? (
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    onClick={() => markAsRead(item.id)}
                  >
                    Marcar leída
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-slate-500">Leída</span>
                )}
              </div>
              <p className="text-slate-700">{item.message}</p>
            </article>
          )) : <p className="text-sm text-slate-500">No hay notificaciones por ahora.</p>}
        </div>
      </div>
    </div>
  );
}