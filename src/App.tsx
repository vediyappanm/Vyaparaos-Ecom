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
import ComingSoon from "./pages/admin/ComingSoon";

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
            <Route path="orders" element={<ComingSoon title="Orders" description="Manage all orders, track status, share invoices" />} />
            <Route path="inventory" element={<ComingSoon title="Inventory" description="Stock levels, movements, low-stock alerts" />} />
            <Route path="parties" element={<ComingSoon title="Parties" description="Customers and vendors with full ledger" />} />
            <Route path="finance" element={<ComingSoon title="Finance" description="Cash, bank, expenses, P&L" />} />
            <Route path="staff" element={<ComingSoon title="Staff" description="Manage staff, roles, attendance, salaries" />} />
            <Route path="invoices" element={<ComingSoon title="Invoices" description="All GST invoices, templates, e-invoice" />} />
            <Route path="reports" element={<ComingSoon title="Reports" description="GST reports, P&L, stock, party ledgers" />} />
            <Route path="ai" element={<ComingSoon title="AI Assistant" description="Ask anything about your business in any Indian language" />} />
            <Route path="settings" element={<ComingSoon title="Settings" description="Store profile, GST, invoice templates, integrations" />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
