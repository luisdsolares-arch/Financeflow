import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { getLastActivityAt, getLockConfig, isSessionLocked, lockSession, recordActivity } from "../services/securityLock";

const isEditableElement = (element) => {
  if (!element || !(element instanceof HTMLElement)) {
    return false;
  }

  const tagName = element.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select" || element.isContentEditable;
};

export default function AppLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const blurActiveFieldOnScroll = () => {
      if (window.innerWidth >= 1024) {
        return;
      }

      const activeElement = document.activeElement;
      if (isEditableElement(activeElement)) {
        activeElement.blur();
      }
    };

    window.addEventListener("scroll", blurActiveFieldOnScroll, { passive: true });
    window.addEventListener("touchmove", blurActiveFieldOnScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", blurActiveFieldOnScroll);
      window.removeEventListener("touchmove", blurActiveFieldOnScroll);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      return undefined;
    }

    const registerActivity = () => recordActivity();
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((eventName) => window.addEventListener(eventName, registerActivity, { passive: true }));
    recordActivity();

    const intervalId = window.setInterval(() => {
      const { pinEnabled, inactivityLockMinutes } = getLockConfig();
      if (!pinEnabled || isSessionLocked()) {
        return;
      }

      const elapsedMs = Date.now() - getLastActivityAt();
      if (elapsedMs >= inactivityLockMinutes * 60 * 1000) {
        lockSession();
        navigate("/unlock", { replace: true });
      }
    }, 15000);

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, registerActivity));
      window.clearInterval(intervalId);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto flex w-full max-w-[430px] sm:max-w-3xl lg:max-w-6xl xl:max-w-[1440px]">
        <Sidebar />
        <main className="w-full pb-24">
          <Header />
          <section className="px-3 py-3 sm:px-5 sm:py-4 lg:px-8 lg:py-6 xl:px-10">
            <Outlet />
          </section>
        </main>
      </div>
    </div>
  );
}
