import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto flex w-full max-w-md lg:max-w-[1600px]">
        <Sidebar />
        <main className="w-full pb-24 lg:pb-0">
          <Header />
          <section className="p-3 md:p-6">
            <Outlet />
          </section>
        </main>
      </div>
    </div>
  );
}
