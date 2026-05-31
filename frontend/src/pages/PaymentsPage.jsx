import { useEffect, useState } from "react";
import api from "../services/api";
import { formatCurrency } from "../services/currency";

export default function PaymentsPage() {
  const [accounts, setAccounts] = useState([]);
  const [rules, setRules] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    account_id: "",
    name: "Pago de renta",
    amount: 1000,
    max_amount: 1200,
    category: "Vivienda",
    day_of_month: 5,
    reminder_days_before: 3,
    description_template: "Pago automático mensual",
  });

  const loadData = async () => {
    try {
      const [acc, rls, sug] = await Promise.all([
        api.get("/payments/accounts"),
        api.get("/payments/rules"),
        api.get("/payments/assistant/suggestions"),
      ]);
      await api.post("/payments/notifications/refresh");
      const ntf = await api.get("/payments/notifications");
      setAccounts(acc.data || []);
      setRules(rls.data || []);
      setSuggestions(sug.data?.suggestions || []);
      setNotifications(ntf.data || []);
      if (!form.account_id && acc.data?.length) {
        setForm((prev) => ({ ...prev, account_id: acc.data[0].id }));
      }
    } catch {
      setStatus("No se pudo cargar el asistente de pagos.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createRule = async (event) => {
    event.preventDefault();
    setStatus("");
    try {
      await api.post("/payments/rules", {
        ...form,
        account_id: Number(form.account_id),
        amount: Number(form.amount),
        max_amount: Number(form.max_amount),
        day_of_month: Number(form.day_of_month),
        reminder_days_before: Number(form.reminder_days_before),
      });
      setStatus("Regla creada correctamente.");
      loadData();
    } catch {
      setStatus("No se pudo crear la regla.");
    }
  };

  const executeDue = async () => {
    setStatus("");
    try {
      const { data } = await api.post("/payments/execute-due");
      setStatus(`Pagos ejecutados: ${data.executed} | Bloqueados por límite: ${data.blocked}`);
      loadData();
    } catch {
      setStatus("No se pudo ejecutar pagos vencidos.");
    }
  };

  const toggleRule = async (rule) => {
    try {
      await api.patch(`/payments/rules/${rule.id}`, { is_active: !rule.is_active });
      loadData();
    } catch {
      setStatus("No se pudo actualizar la regla.");
    }
  };

  const runNow = async (rule) => {
    setStatus("");
    try {
      const { data } = await api.post(`/payments/rules/${rule.id}/run-now`);
      if (data.blocked) {
        setStatus(`Pago bloqueado para regla #${data.rule_id} por exceder limite.`);
      } else {
        setStatus(`Pago ejecutado para regla #${data.rule_id}`);
      }
      loadData();
    } catch {
      setStatus("No se pudo ejecutar la regla ahora.");
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await api.patch(`/payments/notifications/${notificationId}`, { is_read: true });
      setNotifications((prev) => prev.map((item) => (item.id === notificationId ? { ...item, is_read: true } : item)));
    } catch {
      setStatus("No se pudo marcar la notificación como leída.");
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (notificationFilter === "unread") {
      return !item.is_read;
    }
    if (notificationFilter === "read") {
      return item.is_read;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-800">Gestor de Pagos Automáticos</h2>
        <p className="mt-1 text-sm text-slate-500">Crea reglas recurrentes y ejecuta pagos vencidos en un clic.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <form className="panel p-5 space-y-3" onSubmit={createRule}>
          <h3 className="text-sm font-semibold text-slate-700">Nueva Regla</h3>
          <select className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.account_id} onChange={(e) => setForm((p) => ({ ...p, account_id: e.target.value }))}>
            <option value="">Selecciona cuenta</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{`${a.bank_name} ****${a.last_four}`}</option>
            ))}
          </select>
          <input className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nombre de la regla" />
          <input className="w-full rounded-xl border border-slate-200 px-3 py-2" type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder="Monto" />
          <input className="w-full rounded-xl border border-slate-200 px-3 py-2" type="number" value={form.max_amount} onChange={(e) => setForm((p) => ({ ...p, max_amount: e.target.value }))} placeholder="Límite máximo permitido" />
          <input className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="Categoría" />
          <input className="w-full rounded-xl border border-slate-200 px-3 py-2" type="number" min="1" max="28" value={form.day_of_month} onChange={(e) => setForm((p) => ({ ...p, day_of_month: e.target.value }))} placeholder="Día del mes (1-28)" />
          <input className="w-full rounded-xl border border-slate-200 px-3 py-2" type="number" min="1" max="10" value={form.reminder_days_before} onChange={(e) => setForm((p) => ({ ...p, reminder_days_before: e.target.value }))} placeholder="Recordar días antes" />
          <input className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.description_template} onChange={(e) => setForm((p) => ({ ...p, description_template: e.target.value }))} placeholder="Descripción en transacción" />
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Guardar regla</button>
        </form>

        <div className="panel p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Asistente Financiero</h3>
          <button onClick={executeDue} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Ejecutar pagos vencidos</button>
          <div className="space-y-2">
            {suggestions.length ? suggestions.map((s) => (
              <div key={s.description} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-medium text-slate-800">{s.description}</p>
                <p className="text-slate-500">Sugerido: {formatCurrency(s.recommended_amount)} ({s.frequency_hint})</p>
              </div>
            )) : <p className="text-sm text-slate-500">Sin sugerencias por ahora.</p>}
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="text-sm font-semibold text-slate-700">Reglas Activas</h3>
        <div className="mt-3 space-y-2">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <div>
                <p className="font-medium text-slate-800">{rule.name} - {formatCurrency(rule.amount)}</p>
                <p className="text-xs text-slate-500">Día {rule.day_of_month} | Próxima ejecución: {rule.next_run_date} | Límite: {formatCurrency(rule.max_amount)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => runNow(rule)} className="rounded-xl bg-slate-900 px-3 py-1 text-xs font-semibold text-white">Ejecutar ahora</button>
                <button onClick={() => toggleRule(rule)} className={`rounded-xl px-3 py-1 text-xs font-semibold ${rule.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                  {rule.is_active ? "Activa" : "Inactiva"}
                </button>
              </div>
            </div>
          ))}
          {!rules.length ? <p className="text-sm text-slate-500">No hay reglas registradas.</p> : null}
        </div>
      </div>

      <div className="panel p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-700">Alertas y Recordatorios</h3>
          <div className="flex items-center gap-2 text-xs">
            {[
              { key: "all", label: "Todas" },
              { key: "unread", label: "No leídas" },
              { key: "read", label: "Leídas" },
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setNotificationFilter(filterOption.key)}
                className={`min-w-[84px] rounded-xl border px-3 py-1.5 text-center font-semibold transition ${
                  notificationFilter === filterOption.key
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {filteredNotifications.map((n) => (
            <div key={n.id} className={`rounded-xl border p-3 text-sm ${n.kind === "blocked" ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"} ${n.is_read ? "opacity-70" : "opacity-100"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-800">{n.kind === "blocked" ? "Bloqueo de seguridad" : "Recordatorio"}</p>
                  <p className="text-slate-700">{n.message}</p>
                </div>
                {!n.is_read ? (
                  <button
                    onClick={() => markNotificationRead(n.id)}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Marcar leída
                  </button>
                ) : (
                  <span className="rounded-lg bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">Leída</span>
                )}
              </div>
            </div>
          ))}
          {!filteredNotifications.length ? <p className="text-sm text-slate-500">No hay notificaciones para este filtro.</p> : null}
        </div>
      </div>

      {status ? <p className="text-sm text-slate-600">{status}</p> : null}
    </div>
  );
}
