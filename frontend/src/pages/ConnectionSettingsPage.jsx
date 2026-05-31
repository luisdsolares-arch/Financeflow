import { Link2, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getApiBaseUrl, setApiBaseUrl } from "../services/api";
import { getTechnicalAccessStatus, getTechnicalPinPolicy, verifyTechnicalPinAttempt } from "../services/securityLock";

const PRODUCTION_API_URL = "https://financeflow-api-m78a.onrender.com/api/v1";

export default function ConnectionSettingsPage() {
  const [apiBaseUrl, setApiBaseUrlInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [blockedSeconds, setBlockedSeconds] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(getTechnicalPinPolicy().maxAttempts);
  const navigate = useNavigate();
  const location = useLocation();

  const returnTo = useMemo(() => {
    const from = location.state?.from;
    return typeof from === "string" ? from : "/auth";
  }, [location.state]);

  useEffect(() => {
    setUnlocked(false);
    setApiBaseUrlInput(getApiBaseUrl());

    const loadStatus = async () => {
      try {
        const status = await getTechnicalAccessStatus();
        setBlockedSeconds(status.blockedSecondsLeft);
        setAttemptsLeft(status.remainingAttempts);
      } catch {
        setPinError("No se pudo validar el acceso técnico.");
      }
    };

    void loadStatus();
  }, []);

  useEffect(() => {
    if (blockedSeconds <= 0) {
      return;
    }
    const intervalId = window.setInterval(() => {
      setBlockedSeconds((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [blockedSeconds]);

  const unlockTechnicalSettings = async (event) => {
    event.preventDefault();
    setPinError("");

    try {
      const result = await verifyTechnicalPinAttempt(pinInput);
      setBlockedSeconds(result.blockedSecondsLeft);
      setAttemptsLeft(result.remainingAttempts);
      if (!result.ok) {
        setPinError(result.message || "No se pudo validar el PIN técnico.");
        return;
      }

      setUnlocked(true);
      setPinInput("");
    } catch {
      setPinError("No se pudo validar el PIN técnico.");
    }
  };

  const saveConnection = () => {
    setApiBaseUrl(apiBaseUrl);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const restoreProductionConnection = () => {
    setApiBaseUrlInput(PRODUCTION_API_URL);
    setApiBaseUrl(PRODUCTION_API_URL);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-mesh-light px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-premium">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-900 p-2.5 text-white">
            <Link2 size={18} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">FinanceFlow</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">Conexión técnica</h1>
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-500">Acceso técnico protegido. Ingresa tu PIN de seguridad para continuar.</p>

        {!unlocked ? (
          <form className="mt-5 space-y-3" onSubmit={unlockTechnicalSettings}>
            <label className="block text-sm text-slate-600">
              PIN técnico
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                value={pinInput}
                onChange={(event) => setPinInput(event.target.value.replace(/\D+/g, ""))}
                placeholder="Ingresa el PIN"
              />
            </label>
            {blockedSeconds > 0 ? <p className="text-xs text-amber-700">Bloqueado temporalmente. Intenta de nuevo en {blockedSeconds}s.</p> : <p className="text-xs text-slate-500">Intentos restantes: {attemptsLeft}.</p>}
            {pinError ? <p className="text-xs text-rose-700">{pinError}</p> : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => navigate(returnTo)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Volver
              </button>
              <button type="submit" disabled={blockedSeconds > 0} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
                Desbloquear
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">URL API</label>
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                value={apiBaseUrl}
                onChange={(event) => setApiBaseUrlInput(event.target.value)}
                placeholder="http://192.168.1.100:8000/api/v1"
              />
              <p className="mt-2 text-xs text-slate-500">Si escribes solo el dominio, la app agregará automáticamente /api/v1. En Android se sigue priorizando el servidor oficial.</p>
            </div>

            {saved ? <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">Conexión guardada correctamente.</p> : null}

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <button type="button" onClick={() => navigate(returnTo)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Volver
              </button>
              <button type="button" onClick={restoreProductionConnection} className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
                Usar servidor oficial
              </button>
              <button type="button" onClick={saveConnection} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                <Save size={14} />
                Guardar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}