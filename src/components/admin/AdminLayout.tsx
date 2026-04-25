import { Outlet } from "react-router-dom";
import { Sidebar, MobileTabBar } from "./Sidebar";
import { Topbar } from "./Topbar";

export const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-background flex">
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
