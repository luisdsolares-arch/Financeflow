import axios from "axios";
import { Capacitor } from "@capacitor/core";

const API_BASE_URL_KEY = "financeflow.api.base_url";

const defaultBaseUrl =
  Capacitor.getPlatform() === "android"
    ? "https://financeflow-api-m78a.onrender.com/api/v1"
    : "http://localhost:8000/api/v1";

export const getApiBaseUrl = () => {
  const runtimeOverride = localStorage.getItem(API_BASE_URL_KEY);
  if (runtimeOverride && runtimeOverride.trim()) {
    return runtimeOverride.trim();
  }
  return import.meta.env.VITE_API_BASE_URL || defaultBaseUrl;
};

export const setApiBaseUrl = (url) => {
  const cleaned = (url || "").trim();
  if (!cleaned) {
    localStorage.removeItem(API_BASE_URL_KEY);
    api.defaults.baseURL = getApiBaseUrl();
    return;
  }
  localStorage.setItem(API_BASE_URL_KEY, cleaned);
  api.defaults.baseURL = cleaned;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 30s para cubrir cold start de Render free tier
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
