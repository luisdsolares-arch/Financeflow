import { LockKeyhole } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearSessionLockState, unlockSession, verifyPin } from "../services/securityLock";

export default function UnlockPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onUnlock = (event) => {
    event.preventDefault();
    if (!verifyPin(pin)) {
      setError("PIN incorrecto. Intenta de nuevo.");
      return;
    }

    unlockSession();
    navigate("/app/dashboard", { replace: true });
  };

  const logout = () => {
    localStorage.removeItem("token");
    clearSessionLockState();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-mesh-light px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-premium">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-slate-900 text-white">
          <LockKeyhole size={20} />
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold text-slate-900">Sesión bloqueada</h1>
        <p className="mt-1 text-center text-sm text-slate-500">Ingresa tu PIN para continuar.</p>

        <form className="mt-6 space-y-4" onSubmit={onUnlock}>
          <label className="block text-sm text-slate-700">
            PIN
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-400"
              value={pin}
              onChange={(event) => {
                setPin(event.target.value.replace(/\D+/g, ""));
                setError("");
              }}
            />
          </label>

          {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}

          <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            Desbloquear
          </button>
          <button type="button" onClick={logout} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
