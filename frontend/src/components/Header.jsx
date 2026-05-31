import { Bell, LogOut, Search, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

const SETTINGS_KEY = "financeflow.settings.v1";
const SEARCH_HISTORY_KEY = "financeflow.search.history.v1";
const QUICK_ACTIONS = [
  {
    title: "Dashboard",
    description: "Resumen financiero y métricas",
    to: "/app/dashboard",
    keywords: ["inicio", "resumen", "panel", "dashboard"],
  },
  {
    title: "Transacciones",
    description: "Ingresos y gastos detallados",
    to: "/app/transactions",
    keywords: ["movimientos", "gastos", "ingresos", "transacciones"],
  },
  {
    title: "Presupuestos",
    description: "Control por categorías",
    to: "/app/budgets",
    keywords: ["presupuesto", "categorias", "límites", "presupuestos"],
  },
  {
    title: "Consejos",
    description: "Recomendaciones automáticas",
    to: "/app/suggestions",
    keywords: ["sugerencias", "tips", "consejos", "alertas"],
  },
  {
    title: "Gestor de Pagos",
    description: "Reglas y notificaciones",
    to: "/app/payments",
    keywords: ["pagos", "reglas", "recordatorios", "notificaciones"],
  },
  {
    title: "Configuración",
    description: "Perfil, seguridad y preferencias",
    to: "/app/settings",
    keywords: ["config", "perfil", "tema", "seguridad"],
  },
];

const normalizeText = (value) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getInitials = (fullName) => {
  const words = (fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return "AR";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
};

export default function Header() {
  const [openMenu, setOpenMenu] = useState(false);
  const [openMobileSearch, setOpenMobileSearch] = useState(false);
  const [openDesktopSearch, setOpenDesktopSearch] = useState(false);
  const [desktopQuery, setDesktopQuery] = useState("");
  const [mobileQuery, setMobileQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileName, setProfileName] = useState("Andrea Ruiz");
  const menuRef = useRef(null);
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(event.target)) {
        setOpenDesktopSearch(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target)) {
        setOpenMobileSearch(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpenMenu(false);
        setOpenDesktopSearch(false);
        setOpenMobileSearch(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (openMobileSearch && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [openMobileSearch]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 5));
        }
      }
    } catch {
      // Ignore malformed recent-search data.
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUnreadCount(0);
      return;
    }

    let intervalId;

    const loadUnreadNotifications = async () => {
      try {
        const { data } = await api.get("/payments/notifications");
        const unread = Array.isArray(data) ? data.filter((item) => !item.is_read).length : 0;
        setUnreadCount(unread);
      } catch (error) {
        if (error?.response?.status === 401 && intervalId) {
          window.clearInterval(intervalId);
        }
        setUnreadCount(0);
      }
    };

    loadUnreadNotifications();
    intervalId = window.setInterval(loadUnreadNotifications, 45000);
    return () => window.clearInterval(intervalId);
  }, []);

  const saveRecentSearch = (rawTerm) => {
    const term = rawTerm.trim();
    if (!term) {
      return;
    }

    const next = [term, ...recentSearches.filter((item) => item.toLowerCase() !== term.toLowerCase())].slice(0, 5);
    setRecentSearches(next);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
  };

  const findMatchingActions = (rawQuery) => {
    const query = normalizeText(rawQuery);
    if (!query) {
      return [];
    }

    return QUICK_ACTIONS.filter((action) => {
      const haystack = [action.title, action.description, ...action.keywords].map(normalizeText).join(" ");
      return haystack.includes(query);
    }).slice(0, 5);
  };

  const desktopResults = findMatchingActions(desktopQuery);
  const mobileResults = findMatchingActions(mobileQuery);

  const onSearchSubmit = (term, source) => {
    saveRecentSearch(term);
    const matches = findMatchingActions(term);
    if (matches.length) {
      navigate(matches[0].to);
      setOpenDesktopSearch(false);
      setOpenMobileSearch(false);
      if (source === "desktop") {
        setDesktopQuery("");
      }
      if (source === "mobile") {
        setMobileQuery("");
      }
    }
  };

  const onSelectAction = (action, source, originTerm) => {
    saveRecentSearch(originTerm || action.title);
    navigate(action.to);
    setOpenDesktopSearch(false);
    setOpenMobileSearch(false);
    if (source === "desktop") {
      setDesktopQuery("");
    }
    if (source === "mobile") {
      setMobileQuery("");
    }
  };

  const onSearchKeyDown = (event, query, source) => {
    if (event.key === "Enter") {
      onSearchSubmit(query, source);
      if (event.currentTarget === mobileSearchInputRef.current) {
        setOpenMobileSearch(false);
      }
    }
  };

  useEffect(() => {
    const loadNameFromSettings = () => {
      try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (!saved) {
          return;
        }
        const parsed = JSON.parse(saved);
        if (parsed?.profile_name) {
          setProfileName(parsed.profile_name);
        }
      } catch {
        // Keep default name if local settings are malformed.
      }
    };

    const onProfileUpdated = (event) => {
      const updatedName = event?.detail?.profile_name;
      if (updatedName && typeof updatedName === "string") {
        setProfileName(updatedName);
      }
    };

    loadNameFromSettings();
    window.addEventListener("storage", loadNameFromSettings);
    window.addEventListener("financeflow:profile-updated", onProfileUpdated);

    return () => {
      window.removeEventListener("storage", loadNameFromSettings);
      window.removeEventListener("financeflow:profile-updated", onProfileUpdated);
    };
  }, []);

  const goToSettings = () => {
    setOpenMenu(false);
    navigate("/app/settings");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setOpenMenu(false);
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-3 backdrop-blur md:px-6">
      <div className="relative hidden w-full md:block md:max-w-xl" ref={desktopSearchRef}>
        <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input
            className="w-full bg-transparent text-sm text-slate-700 outline-none"
            placeholder="Buscar..."
            value={desktopQuery}
            onFocus={() => setOpenDesktopSearch(true)}
            onChange={(event) => {
              setDesktopQuery(event.target.value);
              setOpenDesktopSearch(true);
            }}
            onKeyDown={(event) => onSearchKeyDown(event, desktopQuery, "desktop")}
          />
        </div>
        {openDesktopSearch && (desktopQuery.trim() || recentSearches.length) ? (
          <div className="search-panel-pop absolute left-0 top-12 z-50 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
            {desktopQuery.trim() ? (
              <div className="space-y-1">
                {desktopResults.length ? (
                  desktopResults.map((action) => (
                    <button
                      key={action.to}
                      type="button"
                      onClick={() => onSelectAction(action, "desktop", desktopQuery)}
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-slate-100"
                    >
                      <span>
                        <span className="block text-sm font-medium text-slate-800">{action.title}</span>
                        <span className="block text-xs text-slate-500">{action.description}</span>
                      </span>
                      <Search size={12} className="text-slate-400" />
                    </button>
                  ))
                ) : (
                  <p className="px-2 py-1 text-sm text-slate-500">No hay coincidencias rápidas.</p>
                )}
              </div>
            ) : (
              <div className="space-y-1 rounded-lg border border-slate-100 bg-slate-50 p-2">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Recientes</p>
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setDesktopQuery(term);
                      onSearchSubmit(term, "desktop");
                    }}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <span>{term}</span>
                    <Search size={12} className="text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
      <div className="relative md:hidden" ref={mobileSearchRef}>
        <button
          type="button"
          onClick={() => setOpenMobileSearch((v) => !v)}
          className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Abrir búsqueda"
          aria-expanded={openMobileSearch}
        >
          <Search size={16} />
        </button>
        {openMobileSearch ? (
          <div className="search-panel-pop absolute left-0 top-12 z-50 w-[min(88vw,320px)] rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <Search size={16} className="text-slate-400" />
              <input
                ref={mobileSearchInputRef}
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
                placeholder="Buscar..."
                value={mobileQuery}
                onChange={(event) => setMobileQuery(event.target.value)}
                onKeyDown={(event) => onSearchKeyDown(event, mobileQuery, "mobile")}
              />
            </div>
            {mobileQuery.trim() ? (
              <div className="mt-2 space-y-1">
                {mobileResults.length ? (
                  mobileResults.map((action) => (
                    <button
                      key={action.to}
                      type="button"
                      onClick={() => onSelectAction(action, "mobile", mobileQuery)}
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-slate-100"
                    >
                      <span>
                        <span className="block text-sm font-medium text-slate-800">{action.title}</span>
                        <span className="block text-xs text-slate-500">{action.description}</span>
                      </span>
                      <Search size={12} className="text-slate-400" />
                    </button>
                  ))
                ) : (
                  <p className="px-2 py-1 text-sm text-slate-500">No hay coincidencias rápidas.</p>
                )}
              </div>
            ) : recentSearches.length ? (
              <div className="mt-2 space-y-1 rounded-lg border border-slate-100 bg-slate-50 p-2">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Recientes</p>
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setMobileQuery(term);
                      onSearchSubmit(term, "mobile");
                    }}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <span>{term}</span>
                    <Search size={12} className="text-slate-400" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => navigate("/app/payments")}
        className="relative rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
        aria-label={unreadCount ? `Notificaciones pendientes: ${unreadCount}` : "Notificaciones"}
      >
        <Bell size={16} />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpenMenu((v) => !v)}
          className="flex items-center rounded-xl border border-slate-200 bg-white px-2 py-1.5 transition hover:bg-slate-50 md:px-3"
          aria-label="Abrir menú de usuario"
          aria-haspopup="menu"
          aria-expanded={openMenu}
        >
          <div className="size-8 rounded-full bg-slate-900 text-center text-xs font-bold leading-8 text-white">{getInitials(profileName)}</div>
        </button>

        {openMenu ? (
          <div className="menu-pop absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl backdrop-blur-xl" role="menu" aria-label="Menú de usuario">
            <div className="mb-1 rounded-lg px-3 py-2">
              <p className="text-sm font-semibold text-slate-800">{profileName}</p>
              <p className="text-xs text-slate-500">Plan Pro</p>
            </div>
            <div className="my-1 h-px bg-slate-200" />
            <button
              type="button"
              onClick={goToSettings}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 ${location.pathname === "/app/settings" ? "bg-slate-100 text-slate-900" : "text-slate-700"}`}
              role="menuitem"
            >
              <Settings size={14} />
              Configuración
            </button>
            <button
              type="button"
              onClick={logout}
              className="mt-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
              role="menuitem"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
