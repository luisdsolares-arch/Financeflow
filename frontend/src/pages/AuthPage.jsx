import { Eye, EyeOff, Fingerprint } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { authenticateWithBiometric, getBiometricSessionToken, isBiometricEnabled, isBiometricSupported, saveBiometricSessionToken } from "../services/biometrics";
import { getApiBaseUrl, setApiBaseUrl } from "../services/api";
import { recordActivity, unlockSession } from "../services/securityLock";

const PRODUCTION_API_URL = "https://financeflow-api-m78a.onrender.com/api/v1";

export default function AuthPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showRepairConnection, setShowRepairConnection] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [lastLogoTap, setLastLogoTap] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setBiometricAvailable(isBiometricSupported());
    setBiometricEnabled(isBiometricEnabled());
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setShowRepairConnection(false);

    if (!form.email || !form.password) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      const { data } = await api.post("/auth/login", { email: normalizedEmail, password: form.password });
      localStorage.setItem("token", data.access_token);
      saveBiometricSessionToken(data.access_token);
      unlockSession();
      recordActivity();
      navigate("/app/dashboard");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string" && detail.trim()) {
        setError(detail);
        return;
      }
      if (!err?.response) {
        setError(`No se pudo conectar con el servidor (${getApiBaseUrl()}). Revisa la configuración de conexión.`);
        setShowRepairConnection(true);
        return;
      }
      setError("No se pudo autenticar. Revisa tus credenciales.");
    }
  };

  const repairConnection = () => {
    setApiBaseUrl(PRODUCTION_API_URL);
    setShowRepairConnection(false);
    setError(`Conexión restablecida al servidor oficial (${PRODUCTION_API_URL}). Intenta iniciar sesión de nuevo.`);
  };

  const loginWithBiometric = async () => {
    setError("");
    setBiometricLoading(true);
    try {
      await authenticateWithBiometric();
      const savedToken = getBiometricSessionToken();
      if (!savedToken) {
        setError("No hay una sesión biométrica guardada. Inicia sesión manualmente primero.");
        return;
      }
      localStorage.setItem("token", savedToken);
      unlockSession();
      recordActivity();
      navigate("/app/dashboard");
    } catch (err) {
      setError(err?.message || "No se pudo iniciar sesión con biometría.");
    } finally {
      setBiometricLoading(false);
    }
  };

  const onLogoTap = () => {
    const now = Date.now();
    const inSequence = now - lastLogoTap < 1200;
    const nextCount = inSequence ? logoTapCount + 1 : 1;
    setLogoTapCount(nextCount);
    setLastLogoTap(now);
    if (nextCount >= 5) {
      setLogoTapCount(0);
      navigate("/connection-settings", { state: { from: "/auth" } });
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-mesh-light px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-premium">
        <button type="button" onClick={onLogoTap} className="text-xs uppercase tracking-[0.2em] text-slate-500">
          FinanceFlow
        </button>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-slate-500">Gestión inteligente de tus finanzas en un solo lugar.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm text-slate-700">
            Correo electrónico
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
          </label>

          <label className="block text-sm text-slate-700">
            Contraseña
            <div className={`mt-1 flex items-center rounded-xl border px-3 ${error ? "border-rose-400" : "border-slate-200"}`}>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full py-2 outline-none"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-slate-400">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <div className="flex justify-between text-xs text-slate-500">
            <button type="button" className="hover:text-slate-800">Olvidé mi contraseña</button>
            <button type="button" className="hover:text-slate-800" onClick={() => navigate("/register")}>
              Crear usuario nuevo
            </button>
          </div>

          {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}

          {showRepairConnection ? (
            <button
              type="button"
              onClick={repairConnection}
              className="w-full rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Reparar conexión automáticamente
            </button>
          ) : null}

          <button className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700" type="submit">
            Iniciar sesión
          </button>

          {biometricAvailable && biometricEnabled ? (
            <button
              type="button"
              onClick={loginWithBiometric}
              disabled={biometricLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Fingerprint size={16} />
              {biometricLoading ? "Verificando biometría..." : "Entrar con biometría"}
            </button>
          ) : null}
        </form>
      </div>
    </div>
  );
}
