import { Outlet } from "react-router-dom";
import { Sidebar, MobileTabBar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export const AdminLayout = () => {
  useRealtimeSync();
  return (
    <div className="min-h-screen flex relative">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[hsl(265_70%_55%/0.18)] blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[480px] h-[480px] rounded-full bg-[hsl(43_90%_60%/0.18)] blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[420px] h-[420px] rounded-full bg-[hsl(310_70%_50%/0.15)] blur-3xl" />
      </div>

      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 pb-20 lg:pb-6">
          <Outlet />
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
};
