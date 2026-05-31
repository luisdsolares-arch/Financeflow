import api from "./api";

const SETTINGS_KEY = "financeflow.settings.v1";
const LOCK_STATE_KEY = "financeflow.security.locked.v1";
const LAST_ACTIVE_AT_KEY = "financeflow.security.last_active_at.v1";
const TECH_MAX_ATTEMPTS = 3;
const TECH_BLOCK_MS = 30_000;

const toInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeSettings = (next) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
};

export const hashPin = (pin) => {
  let hash = 5381;
  const seed = `financeflow:${pin}:v1`;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 33) ^ seed.charCodeAt(index);
  }
  return `h${Math.abs(hash >>> 0).toString(16)}`;
};

export const getLockConfig = () => {
  const settings = readSettings();
  const timeoutMinutes = Math.min(Math.max(toInt(settings.inactivity_lock_minutes, 5), 1), 120);
  return {
    pinEnabled: Boolean(settings.security_pin_enabled && settings.security_pin_hash),
    pinHash: settings.security_pin_hash || "",
    inactivityLockMinutes: timeoutMinutes,
  };
};

export const verifyPin = (pin) => {
  const normalized = String(pin || "").trim();
  if (!/^\d{4,6}$/.test(normalized)) {
    return false;
  }
  const { pinHash } = getLockConfig();
  return Boolean(pinHash) && hashPin(normalized) === pinHash;
};

export const savePin = (pin) => {
  const normalized = String(pin || "").trim();
  if (!/^\d{4,6}$/.test(normalized)) {
    return "";
  }

  const settings = readSettings();
  const nextHash = hashPin(normalized);
  writeSettings({
    ...settings,
    security_pin_enabled: true,
    security_pin_hash: nextHash,
  });
  return nextHash;
};

export const disablePin = () => {
  const settings = readSettings();
  writeSettings({
    ...settings,
    security_pin_enabled: false,
    security_pin_hash: "",
  });
  unlockSession();
};

export const recordActivity = () => {
  localStorage.setItem(LAST_ACTIVE_AT_KEY, String(Date.now()));
};

export const getLastActivityAt = () => toInt(localStorage.getItem(LAST_ACTIVE_AT_KEY), Date.now());

export const lockSession = () => {
  localStorage.setItem(LOCK_STATE_KEY, "1");
  window.dispatchEvent(new Event("financeflow:session-locked"));
};

export const unlockSession = () => {
  localStorage.setItem(LOCK_STATE_KEY, "0");
  recordActivity();
  window.dispatchEvent(new Event("financeflow:session-unlocked"));
};

export const isSessionLocked = () => localStorage.getItem(LOCK_STATE_KEY) === "1";

export const clearSessionLockState = () => {
  localStorage.removeItem(LOCK_STATE_KEY);
  localStorage.removeItem(LAST_ACTIVE_AT_KEY);
  window.dispatchEvent(new Event("financeflow:session-unlocked"));
};

export const getTechnicalPinPolicy = () => ({
  maxAttempts: TECH_MAX_ATTEMPTS,
  blockDurationMs: TECH_BLOCK_MS,
});

export const getTechnicalAccessStatus = async () => {
  const { data } = await api.get("/auth/technical-access/status");
  return {
    ok: Boolean(data?.ok),
    isBlocked: Boolean(data?.is_blocked),
    blockedSecondsLeft: Number(data?.blocked_seconds_left || 0),
    remainingAttempts: Number(data?.remaining_attempts || 0),
    message: String(data?.message || ""),
  };
};

export const verifyTechnicalPinAttempt = async (pin) => {
  const { data } = await api.post("/auth/technical-access/verify", { pin: String(pin || "") });
  return {
    ok: Boolean(data?.ok),
    isBlocked: Boolean(data?.is_blocked),
    blockedSecondsLeft: Number(data?.blocked_seconds_left || 0),
    remainingAttempts: Number(data?.remaining_attempts || 0),
    message: String(data?.message || ""),
  };
};
