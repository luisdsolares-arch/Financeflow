import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import AuthPage from "./pages/AuthPage";
import BudgetsPage from "./pages/BudgetsPage";
import ConnectionSettingsPage from "./pages/ConnectionSettingsPage";
import DashboardPage from "./pages/DashboardPage";
import GoalsPage from "./pages/GoalsPage";
import NotificationsPage from "./pages/NotificationsPage";
import PaymentsPage from "./pages/PaymentsPage";
import RegisterPage from "./pages/RegisterPage";
import SettingsPage from "./pages/SettingsPage";
import SuggestionsPage from "./pages/SuggestionsPage";
import TransactionsPage from "./pages/TransactionsPage";
import UnlockPage from "./pages/UnlockPage";
import { getLockConfig, isSessionLocked } from "./services/securityLock";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const lockConfig = getLockConfig();
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  if (lockConfig.pinEnabled && isSessionLocked()) {
    return <Navigate to="/unlock" replace />;
  }
  return children;
}

export default function App() {
  const [, setAuthVersion] = useState(0);

  useEffect(() => {
    const bump = () => setAuthVersion((value) => value + 1);
    window.addEventListener("storage", bump);
    window.addEventListener("financeflow:session-locked", bump);
    window.addEventListener("financeflow:session-unlocked", bump);
    return () => {
      window.removeEventListener("storage", bump);
      window.removeEventListener("financeflow:session-locked", bump);
      window.removeEventListener("financeflow:session-unlocked", bump);
    };
  }, []);

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/connection-settings" element={<ConnectionSettingsPage />} />
      <Route path="/unlock" element={<UnlockGate />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="budgets" element={<BudgetsPage />} />
        <Route path="suggestions" element={<SuggestionsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}

function UnlockGate() {
  const token = localStorage.getItem("token");
  const lockConfig = getLockConfig();

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  if (!lockConfig.pinEnabled || !isSessionLocked()) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <UnlockPage />;
}
