import axios from "axios";
import { Capacitor } from "@capacitor/core";

const API_BASE_URL_KEY = "financeflow.api.base_url";
const RENDER_API_BASE_URL = "https://financeflow-api-m78a.onrender.com/api/v1";
const LEGACY_API_BASE_URLS = [
  "https://financeflow-api.onrender.com/api/v1",
  "https://financeflow-api.onrender.com",
  "https://financeflow-api-m78a.onrender.com",
  "https://heavy-tools-attend.loca.lt/api/v1",
  "https://heavy-tools-attend.loca.lt",
];

const normalizeBaseUrl = (value) => (value || "").trim().replace(/\/$/, "");

const ensureApiV1Path = (value) => {
  const normalized = normalizeBaseUrl(value);
  if (!normalized) {
    return "";
  }
  return normalized.endsWith("/api/v1") ? normalized : `${normalized}/api/v1`;
};

const migrateLegacyBaseUrl = (value) => {
  const normalized = normalizeBaseUrl(value);
  if (!normalized) {
    return "";
  }

  const isLegacy = LEGACY_API_BASE_URLS.some((legacyUrl) => normalized === normalizeBaseUrl(legacyUrl));
  if (isLegacy) {
    return RENDER_API_BASE_URL;
  }

  return ensureApiV1Path(normalized);
};

const defaultBaseUrl =
  Capacitor.getPlatform() === "android"
    ? RENDER_API_BASE_URL
    : "http://localhost:8000/api/v1";

export const getApiBaseUrl = () => {
  const runtimeOverride = localStorage.getItem(API_BASE_URL_KEY);
  if (runtimeOverride && runtimeOverride.trim()) {
    const migratedOverride = migrateLegacyBaseUrl(runtimeOverride);
    if (migratedOverride !== normalizeBaseUrl(runtimeOverride)) {
      localStorage.setItem(API_BASE_URL_KEY, migratedOverride);
    }
    return migratedOverride;
  }
  return migrateLegacyBaseUrl(import.meta.env.VITE_API_BASE_URL || defaultBaseUrl);
};

export const setApiBaseUrl = (url) => {
  const cleaned = migrateLegacyBaseUrl(url);
  if (!cleaned) {
    localStorage.removeItem(API_BASE_URL_KEY);
    api.defaults.baseURL = getApiBaseUrl();
    return;
  }
  localStorage.setItem(API_BASE_URL_KEY, cleaned);
  api.defaults.baseURL = cleaned;
};

const hasRuntimeApiOverride = () => {
  const value = localStorage.getItem(API_BASE_URL_KEY);
  return Boolean(value && value.trim());
};

const resetToDefaultApiBaseUrl = () => {
  localStorage.removeItem(API_BASE_URL_KEY);
  api.defaults.baseURL = getApiBaseUrl();
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 90000, // 90s para cubrir cold start y redes moviles inestables
});

let authRedirectInProgress = false;

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const baseUrl = config.baseURL || "";
  if (baseUrl.includes("loca.lt")) {
    config.headers = config.headers || {};
    config.headers["bypass-tunnel-reminder"] = "1";
  }
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error?.response && error?.config && !error.config.__retryWithDefaultApi && hasRuntimeApiOverride()) {
      resetToDefaultApiBaseUrl();
      return api.request({
        ...error.config,
        __retryWithDefaultApi: true,
        baseURL: getApiBaseUrl(),
      });
    }

    const status = error?.response?.status;
    const requestUrl = error?.config?.url || "";
    const isAuthEndpoint = requestUrl.includes("/auth/login") || requestUrl.includes("/auth/register");

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("token");
      localStorage.removeItem("financeflow.biometric.token");

      if (!authRedirectInProgress && window.location.pathname !== "/auth") {
        authRedirectInProgress = true;
        window.dispatchEvent(new CustomEvent("financeflow:auth-expired"));
        window.location.replace("/auth");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
