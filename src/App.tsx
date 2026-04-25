import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AdminLayout } from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import POS from "./pages/admin/POS";
import Orders from "./pages/admin/Orders";
import Invoices from "./pages/admin/Invoices";
import Inventory from "./pages/admin/Inventory";
import Purchases from "./pages/admin/Purchases";
import Parties from "./pages/admin/Parties";
import Finance from "./pages/admin/Finance";
import Staff from "./pages/admin/Staff";
import Reports from "./pages/admin/Reports";
import AI from "./pages/admin/AI";
import SettingsPage from "./pages/admin/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="pos" element={<POS />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="parties" element={<Parties />} />
            <Route path="finance" element={<Finance />} />
            <Route path="staff" element={<Staff />} />
            <Route path="reports" element={<Reports />} />
            <Route path="ai" element={<AI />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
