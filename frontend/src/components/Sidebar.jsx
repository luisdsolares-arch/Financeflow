import { LayoutDashboard, ArrowLeftRight, PiggyBank, Lightbulb, Settings, Bot } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard", short: "Inicio" },
  { to: "/app/transactions", icon: ArrowLeftRight, label: "Transacciones", short: "Gastos" },
  { to: "/app/budgets", icon: PiggyBank, label: "Presupuestos", short: "Presup." },
  { to: "/app/suggestions", icon: Lightbulb, label: "Consejos", short: "Tips" },
  { to: "/app/payments", icon: Bot, label: "Gestor de Pagos", short: "Pagos" },
  { to: "/app/settings", icon: Settings, label: "Configuración", short: "Ajustes" },
];

export default function Sidebar() {
  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white/90 px-4 py-6 backdrop-blur lg:block">
        <div className="mb-8 rounded-xl bg-slateDeep px-4 py-3 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">FinanceFlow</p>
          <p className="mt-1 text-lg font-bold">Premium Suite</p>
        </div>
        <nav className="space-y-2">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                <Icon size={17} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <nav className="mobile-tabbar fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-1 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {links.slice(0, 5).map((item) => {
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
    </>
  );
}
