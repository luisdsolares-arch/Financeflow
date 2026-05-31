import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { clearBiometricConfig, enableBiometricLogin, isBiometricEnabled, isBiometricSupported } from "../services/biometrics";
import { clearSessionLockState, disablePin, savePin } from "../services/securityLock";

const SETTINGS_KEY = "financeflow.settings.v1";
const PROFILE_UPDATED_EVENT = "financeflow:profile-updated";

const defaultSettings = {
  profile_name: "Andrea Ruiz",
  profile_email: "demo.app@example.com",
  currency: "EUR",
  monthly_savings_goal: 20,
  weekly_budget_alert_threshold: 80,
  require_2fa_for_sensitive_actions: false,
  notify_email: true,
  notify_push: true,
  notify_payment_reminders: true,
  auto_sync_bank_daily: true,
  payment_assistant_enabled: true,
  default_payment_limit: 1200,
  dark_mode: false,
  security_pin_enabled: false,
  security_pin_hash: "",
  inactivity_lock_minutes: 5,
};

const applyTheme = (isDarkMode) => {
  document.documentElement.classList.toggle("dark-mode", isDarkMode);
};

const broadcastProfileName = (profileName) => {
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: { profile_name: profileName } }));
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [settings, setSettings] = useState(defaultSettings);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pinDraft, setPinDraft] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get("/settings");
        const merged = { ...defaultSettings, ...response.data, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
        setSettings(merged);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
        broadcastProfileName(response.data.profile_name);
        applyTheme(Boolean(response.data.dark_mode));
        return;
      } catch {
        // Keep UX resilient by falling back to local cache if API is unavailable.
      }

      try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSettings((prev) => ({ ...prev, ...parsed }));
          broadcastProfileName(parsed.profile_name || defaultSettings.profile_name);
          applyTheme(Boolean(parsed.dark_mode));
          setStatus("Sin conexión al servidor. Usando configuración local.");
        } else {
          broadcastProfileName(defaultSettings.profile_name);
          applyTheme(defaultSettings.dark_mode);
        }
      } catch {
        // Ignore malformed local storage and use defaults.
        broadcastProfileName(defaultSettings.profile_name);
        applyTheme(defaultSettings.dark_mode);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    setBiometricAvailable(isBiometricSupported());
    setBiometricEnabled(isBiometricEnabled());
  }, []);

  const updateField = (key, value) => {
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
    if (key === "profile_name") {
      broadcastProfileName(value);
    }
    if (key === "dark_mode") {
      applyTheme(Boolean(value));
      void saveSettings(nextSettings);
    }
  };

  const saveSettings = async (values = settings) => {
    setIsSaving(true);
    try {
      const payload = { ...values };
      delete payload.security_pin_hash;
      const response = await api.put("/settings", payload);
      const merged = { ...values, ...response.data };
      setSettings(merged);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      broadcastProfileName(response.data.profile_name || values.profile_name);
      applyTheme(Boolean(response.data.dark_mode));
      setStatus("Configuración guardada correctamente en todos tus dispositivos.");
      return true;
    } catch {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(values));
      broadcastProfileName(values.profile_name);
      applyTheme(Boolean(values.dark_mode));
      setStatus("No se pudo sincronizar con el servidor. Se guardó solo en este dispositivo.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const resetSettings = async () => {
    const resetValues = {
      ...defaultSettings,
      profile_name: settings.profile_name,
      profile_email: settings.profile_email,
    };
    setSettings(resetValues);
    broadcastProfileName(resetValues.profile_name);
    const synced = await saveSettings(resetValues);
    if (synced) {
      setStatus("Configuración restablecida a valores por defecto.");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    clearSessionLockState();
    navigate("/auth");
  };

  const applyPinChanges = () => {
    if (!settings.security_pin_enabled) {
      disablePin();
      const nextValues = { ...settings, security_pin_hash: "" };
      setSettings(nextValues);
      setPinDraft("");
      setPinConfirm("");
      setStatus("PIN desactivado.");
      return { ok: true, values: nextValues };
    }

    if (!pinDraft && settings.security_pin_hash) {
      return { ok: true, values: settings };
    }

    if (!/^\d{4,6}$/.test(pinDraft)) {
      setStatus("El PIN debe tener entre 4 y 6 dígitos.");
      return { ok: false, values: settings };
    }
    if (pinDraft !== pinConfirm) {
      setStatus("El PIN y su confirmación no coinciden.");
      return { ok: false, values: settings };
    }

    const nextHash = savePin(pinDraft);
    if (!nextHash) {
      setStatus("No se pudo guardar el PIN.");
      return { ok: false, values: settings };
    }

    const nextValues = { ...settings, security_pin_hash: nextHash };
    setSettings(nextValues);
    setPinDraft("");
    setPinConfirm("");
    setStatus("PIN configurado correctamente.");
    return { ok: true, values: nextValues };
  };

  const connectBank = async () => {
    setStatus("Abriendo widget seguro...");

    // Simulación del callback onSuccess de Plaid/Belvo
    const publicToken = `public-sandbox-${Date.now()}`;

    try {
      await api.post("/bank/authenticate", {
        public_token: publicToken,
        institution_name: "Banco Demo",
        account_type: "checking",
        last_four: "9081",
      });
      setStatus("Cuenta conectada. Solo lectura habilitada.");
    } catch {
      setStatus("No se pudo conectar la cuenta bancaria.");
    }
  };

  const toggleBiometric = async (enabled) => {
    if (!enabled) {
      clearBiometricConfig();
      setBiometricEnabled(false);
      setStatus("Inicio de sesión biométrico desactivado.");
      return;
    }

    try {
      await enableBiometricLogin(settings.profile_email);
      setBiometricEnabled(true);
      setStatus("Inicio de sesión biométrico activado correctamente.");
    } catch (error) {
      setBiometricEnabled(false);
      setStatus(error?.message || "No se pudo activar la biometría en este dispositivo.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <h2 className="text-lg font-semibold text-slate-800">Configuración de la Aplicación</h2>
        <p className="mt-1 text-sm text-slate-500">Personaliza seguridad, notificaciones, preferencias financieras y automatización de pagos.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="panel space-y-4 p-5">
          <h3 className="text-sm font-semibold text-slate-700">Perfil</h3>
          <label className="block text-sm text-slate-600">
            Nombre
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={settings.profile_name}
              onChange={(e) => updateField("profile_name", e.target.value)}
            />
          </label>
          <label className="block text-sm text-slate-600">
            Correo
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={settings.profile_email}
              onChange={(e) => updateField("profile_email", e.target.value)}
            />
          </label>
          <label className="block text-sm text-slate-600">
            Moneda principal
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={settings.currency}
              onChange={(e) => updateField("currency", e.target.value)}
            >
              <option value="EUR">EUR - Euro</option>
              <option value="USD">USD - Dólar</option>
              <option value="DOP">DOP - Peso Dominicano</option>
            </select>
          </label>
        </div>

        <div className="panel space-y-4 p-5">
          <h3 className="text-sm font-semibold text-slate-700">Objetivos y Alertas</h3>
          <label className="block text-sm text-slate-600">
            Meta de ahorro mensual (%)
            <input
              type="number"
              min="1"
              max="100"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={settings.monthly_savings_goal}
              onChange={(e) => updateField("monthly_savings_goal", Number(e.target.value))}
            />
          </label>
          <label className="block text-sm text-slate-600">
            Umbral alerta de presupuesto semanal (%)
            <input
              type="number"
              min="1"
              max="100"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={settings.weekly_budget_alert_threshold}
              onChange={(e) => updateField("weekly_budget_alert_threshold", Number(e.target.value))}
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={settings.notify_payment_reminders}
              onChange={(e) => updateField("notify_payment_reminders", e.target.checked)}
            />
            Activar recordatorios de pagos automáticos
          </label>
        </div>

        <div className="panel space-y-4 p-5">
          <h3 className="text-sm font-semibold text-slate-700">Seguridad y Sesión</h3>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={settings.require_2fa_for_sensitive_actions}
              onChange={(e) => updateField("require_2fa_for_sensitive_actions", e.target.checked)}
            />
            Solicitar verificación adicional para acciones sensibles
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={settings.dark_mode} onChange={(e) => updateField("dark_mode", e.target.checked)} />
            Activar modo oscuro
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={settings.security_pin_enabled}
              onChange={(e) => updateField("security_pin_enabled", e.target.checked)}
            />
            Bloquear app con PIN
          </label>
          {settings.security_pin_enabled ? (
            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="block text-sm text-slate-600">
                Nuevo PIN (4-6 dígitos)
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={pinDraft}
                  onChange={(e) => setPinDraft(e.target.value.replace(/\D+/g, ""))}
                />
              </label>
              <label className="block text-sm text-slate-600">
                Confirmar PIN
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D+/g, ""))}
                />
              </label>
              <label className="block text-sm text-slate-600">
                Bloqueo por inactividad (minutos)
                <input
                  type="number"
                  min="1"
                  max="120"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={settings.inactivity_lock_minutes}
                  onChange={(e) => updateField("inactivity_lock_minutes", Number(e.target.value))}
                />
              </label>
            </div>
          ) : null}
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={biometricEnabled}
              disabled={!biometricAvailable}
              onChange={(e) => toggleBiometric(e.target.checked)}
            />
            Activar inicio de sesión biométrico
          </label>
          {!biometricAvailable ? <p className="text-xs text-slate-500">Biometría no disponible en este navegador/dispositivo.</p> : null}
        </div>

        <div className="panel space-y-4 p-5">
          <h3 className="text-sm font-semibold text-slate-700">Notificaciones</h3>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={settings.notify_email} onChange={(e) => updateField("notify_email", e.target.checked)} />
            Notificaciones por correo
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={settings.notify_push} onChange={(e) => updateField("notify_push", e.target.checked)} />
            Notificaciones push
          </label>
        </div>

        <div className="panel space-y-4 p-5 xl:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700">Open Banking y Automatización</h3>
          <p className="text-sm text-slate-500">
            Tus credenciales bancarias no pasan por nuestros servidores. Solo recibimos tokens regulados PSD2/Open Banking.
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={settings.auto_sync_bank_daily}
                onChange={(e) => updateField("auto_sync_bank_daily", e.target.checked)}
              />
              Sincronización diaria automática
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={settings.payment_assistant_enabled}
                onChange={(e) => updateField("payment_assistant_enabled", e.target.checked)}
              />
              Activar asistente de pagos
            </label>
            <label className="block text-sm text-slate-600 md:col-span-2">
              Límite por defecto para nuevas reglas de pago
              <input
                type="number"
                min="0"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={settings.default_payment_limit}
                onChange={(e) => updateField("default_payment_limit", Number(e.target.value))}
              />
            </label>
          </div>

          <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500" onClick={connectBank}>
            Conectar Cuenta Bancaria
          </button>
        </div>
      </div>

      <div className="panel flex flex-wrap items-center gap-2 p-4">
        <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" onClick={() => {
          const pinResult = applyPinChanges();
          if (!pinResult.ok) {
            return;
          }
          void saveSettings(pinResult.values);
        }} disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </button>
        <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60" onClick={resetSettings} disabled={isSaving}>
          Restablecer
        </button>
        {status ? <p className="text-sm text-slate-700">{status}</p> : null}
      </div>
    </div>
  );
}
