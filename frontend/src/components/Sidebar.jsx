import { LayoutDashboard, ArrowLeftRight, PiggyBank, Lightbulb, Settings, Bot, Target, BellRing } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard", short: "Inicio" },
  { to: "/app/transactions", icon: ArrowLeftRight, label: "Transacciones", short: "Gastos" },
  { to: "/app/budgets", icon: PiggyBank, label: "Presupuestos", short: "Presup." },
  { to: "/app/suggestions", icon: Lightbulb, label: "Consejos", short: "Tips" },
  { to: "/app/payments", icon: Bot, label: "Gestor de Pagos", short: "Pagos" },
  { to: "/app/goals", icon: Target, label: "Metas", short: "Metas" },
  { to: "/app/notifications", icon: BellRing, label: "Alertas", short: "Alertas" },
  { to: "/app/settings", icon: Settings, label: "Configuración", short: "Config." },
];

export default function Sidebar() {
  return (
    <nav className="mobile-tabbar fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-1 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {[links[0], links[1], links[2], links[5], links[7]].map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 transition ${
                  isActive ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span className="w-full text-center text-[10px] font-semibold leading-tight">{item.short}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
