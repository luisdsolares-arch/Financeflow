import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getApiBaseUrl } from "../services/api";
import { getTechnicalAccessStatus, getTechnicalPinPolicy, verifyTechnicalPinAttempt } from "../services/securityLock";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [lastLogoTap, setLastLogoTap] = useState(0);
  const [showTechnicalPinPrompt, setShowTechnicalPinPrompt] = useState(false);
  const [technicalPinInput, setTechnicalPinInput] = useState("");
  const [technicalPinError, setTechnicalPinError] = useState("");
  const [technicalBlockedSeconds, setTechnicalBlockedSeconds] = useState(0);
  const [technicalAttemptsLeft, setTechnicalAttemptsLeft] = useState(getTechnicalPinPolicy().maxAttempts);
  const navigate = useNavigate();

  const refreshTechnicalStatus = async () => {
    try {
      const status = await getTechnicalAccessStatus();
      setTechnicalBlockedSeconds(status.blockedSecondsLeft);
      setTechnicalAttemptsLeft(status.remainingAttempts);
    } catch {
      setTechnicalPinError("No se pudo validar el acceso técnico.");
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
      setTechnicalPinInput("");
      setTechnicalPinError("");
      setShowTechnicalPinPrompt(true);
    }
  };

  useEffect(() => {
    if (!showTechnicalPinPrompt) {
      return undefined;
    }
    void refreshTechnicalStatus();
    return undefined;
  }, [showTechnicalPinPrompt]);

  useEffect(() => {
    if (!showTechnicalPinPrompt || technicalBlockedSeconds <= 0) {
      return;
    }
    const intervalId = window.setInterval(() => {
      setTechnicalBlockedSeconds((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [showTechnicalPinPrompt, technicalBlockedSeconds]);

  const confirmTechnicalAccess = async () => {
    setTechnicalPinError("");
    try {
      const result = await verifyTechnicalPinAttempt(technicalPinInput);
      setTechnicalBlockedSeconds(result.blockedSecondsLeft);
      setTechnicalAttemptsLeft(result.remainingAttempts);
      if (!result.ok) {
        setTechnicalPinError(result.message || "No se pudo validar el PIN técnico.");
        return;
      }
      setShowTechnicalPinPrompt(false);
      setTechnicalPinInput("");
      navigate("/connection-settings", { state: { from: "/register" } });
    } catch {
      setTechnicalPinError("No se pudo validar el PIN técnico.");
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (!name || !email || !form.password || !form.confirmPassword) {
      setError("Completa nombre, correo y credenciales.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password: form.password,
      });
      localStorage.setItem("token", data.access_token);
      setSuccess("Usuario creado correctamente. Redirigiendo...");
      navigate("/app/dashboard");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string" && detail.trim()) {
        setError(detail);
        return;
      }
      if (!err?.response) {
        setError(`No se pudo conectar con el servidor (${getApiBaseUrl()}). Revisa la configuración de conexión.`);
        return;
      }
      setError("No se pudo crear el usuario. Revisa los datos ingresados.");
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-mesh-light px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-premium">
        <div className="flex items-start justify-between gap-4">
          <div>
            <button type="button" onClick={onLogoTap} className="text-xs uppercase tracking-[0.2em] text-slate-500">
              FinanceFlow
            </button>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Registrar nuevo usuario</h1>
            <p className="mt-1 text-sm text-slate-500">Completa los datos del usuario y sus credenciales de acceso.</p>
          </div>
          <div className="rounded-2xl bg-slate-900 p-3 text-white shadow-lg shadow-slate-200">
            <UserPlus size={22} />
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={onSubmit}>
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Datos del usuario</h2>
              <p className="mt-1 text-xs text-slate-500">Información básica de la persona que usará la cuenta.</p>
            </div>

            <label className="block text-sm text-slate-700">
              Nombre completo
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-slate-400"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ej. Ana Pérez"
              />
            </label>

            <label className="block text-sm text-slate-700">
              Correo electrónico
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-slate-400"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="usuario@correo.com"
              />
            </label>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Credenciales</h2>
              <p className="mt-1 text-xs text-slate-500">Define la contraseña para entrar en la app.</p>
            </div>

            <label className="block text-sm text-slate-700">
              Contraseña
              <div className="mt-1 flex items-center rounded-xl border border-slate-200 px-3 focus-within:border-slate-400">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full py-2 outline-none"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-slate-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <label className="block text-sm text-slate-700">
              Confirmar contraseña
              <div className="mt-1 flex items-center rounded-xl border border-slate-200 px-3 focus-within:border-slate-400">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full py-2 outline-none"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Repite la contraseña"
                />
                <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="text-slate-400">
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
          </section>

          {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}
          {success ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{success}</p> : null}

          {showTechnicalPinPrompt ? (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Acceso técnico</p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                placeholder="PIN"
                value={technicalPinInput}
                onChange={(event) => setTechnicalPinInput(event.target.value.replace(/\D+/g, ""))}
              />
              {technicalBlockedSeconds > 0 ? <p className="text-xs text-amber-700">Bloqueado temporalmente. Intenta de nuevo en {technicalBlockedSeconds}s.</p> : <p className="text-xs text-slate-500">Intentos restantes: {technicalAttemptsLeft}.</p>}
              {technicalPinError ? <p className="text-xs text-rose-700">{technicalPinError}</p> : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTechnicalPinPrompt(false);
                    setTechnicalPinInput("");
                    setTechnicalPinError("");
                  }}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button type="button" onClick={confirmTechnicalAccess} disabled={technicalBlockedSeconds > 0} className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
                  Continuar
                </button>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => navigate("/auth")} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Volver al inicio
            </button>
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700" type="submit">
              Crear usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}