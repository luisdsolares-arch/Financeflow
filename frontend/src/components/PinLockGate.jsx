import { useEffect, useState } from "react";

const PIN_KEY = "financeflow.security.pin.v1";
const LOCK_MINUTES_KEY = "financeflow.security.lock_minutes.v1";
const LAST_ACTIVITY_KEY = "financeflow.security.last_activity.v1";
const UNLOCKED_KEY = "financeflow.security.unlocked.v1";

const DEFAULT_LOCK_MINUTES = 5;

const readLockMinutes = () => {
  const raw = Number(localStorage.getItem(LOCK_MINUTES_KEY) || DEFAULT_LOCK_MINUTES);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_LOCK_MINUTES;
};

const now = () => Date.now();

const markActivity = () => {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(now()));
};

export default function PinLockGate({ children }) {
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCKED_KEY) === "1");
  const [storedPin, setStoredPin] = useState(() => localStorage.getItem(PIN_KEY) || "");
  const hasPin = Boolean(storedPin);

  useEffect(() => {
    const syncPin = () => setStoredPin(localStorage.getItem(PIN_KEY) || "");
    window.addEventListener("storage", syncPin);
    window.addEventListener("financeflow:security-updated", syncPin);
    return () => {
      window.removeEventListener("storage", syncPin);
      window.removeEventListener("financeflow:security-updated", syncPin);
    };
  }, []);

  useEffect(() => {
    if (!hasPin) {
      return;
    }
    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      markActivity();
    }
  }, [hasPin]);

  useEffect(() => {
    if (!hasPin) {
      return;
    }

    const activityHandler = () => {
      if (!unlocked) {
        return;
      }
      markActivity();
    };

    const checkInactivity = () => {
      if (!unlocked) {
        return;
      }
      const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || now());
      const maxIdleMs = readLockMinutes() * 60 * 1000;
      if (now() - lastActivity > maxIdleMs) {
        setUnlocked(false);
        sessionStorage.setItem(UNLOCKED_KEY, "0");
        setError("");
        setPinInput("");
      }
    };

    const intervalId = window.setInterval(checkInactivity, 15000);
    window.addEventListener("mousemove", activityHandler, { passive: true });
    window.addEventListener("keydown", activityHandler);
    window.addEventListener("touchstart", activityHandler, { passive: true });
    window.addEventListener("click", activityHandler, { passive: true });

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("mousemove", activityHandler);
      window.removeEventListener("keydown", activityHandler);
      window.removeEventListener("touchstart", activityHandler);
      window.removeEventListener("click", activityHandler);
    };
  }, [hasPin, unlocked]);

  if (!hasPin) {
    return children;
  }

  const unlock = (event) => {
    event.preventDefault();
    const encoded = btoa(pinInput.trim());
    if (!pinInput.trim() || encoded !== storedPin) {
      setError("PIN incorrecto.");
      return;
    }
    setUnlocked(true);
    sessionStorage.setItem(UNLOCKED_KEY, "1");
    markActivity();
    setPinInput("");
    setError("");
  };

  if (!unlocked) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas px-4 py-10">
        <form className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-premium" onSubmit={unlock}>
          <h2 className="text-lg font-semibold text-slate-800">App bloqueada</h2>
          <p className="mt-1 text-sm text-slate-500">Introduce tu PIN para continuar.</p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={8}
            className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-center tracking-[0.3em]"
            value={pinInput}
            onChange={(event) => setPinInput(event.target.value.replace(/\D/g, ""))}
            placeholder="••••"
          />
          {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
          <button className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Desbloquear</button>
        </form>
      </div>
    );
  }

  return children;
}