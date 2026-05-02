import { Outlet } from "react-router-dom";
import { Sidebar, MobileTabBar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export const AdminLayout = () => {
  useRealtimeSync();
  return (
    <div className="min-h-screen flex relative admin-page-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 pb-20 lg:pb-8">
          <Outlet />
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
};
