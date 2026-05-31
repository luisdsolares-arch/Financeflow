const SETTINGS_KEY = "financeflow.settings.v1";

const symbolByCurrency = {
  EUR: "EUR",
  USD: "USD",
  DOP: "DOP",
};

export const getPrimaryCurrency = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return "EUR";
    }
    const parsed = JSON.parse(raw);
    const currency = String(parsed?.currency || "").toUpperCase();
    return symbolByCurrency[currency] || "EUR";
  } catch {
    return "EUR";
  }
};

export const formatCurrency = (value, currency = getPrimaryCurrency()) => {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
};
