import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/layouts/AppLayout";
import AdminLayout from "@/layouts/AdminLayout";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import AddExpense from "@/pages/AddExpense";
import AddIncome from "@/pages/AddIncome";
import Expenses from "@/pages/Expenses";
import Reports from "@/pages/Reports";
import Profile from "@/pages/Profile";
import Udhari from "@/pages/Udhari";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import SignupRequests from "@/pages/admin/SignupRequests";
import UserManagement from "@/pages/admin/UserManagement";
import RolesPermissions from "@/pages/admin/RolesPermissions";
import SystemActivity from "@/pages/admin/SystemActivity";
import AdminSettings from "@/pages/admin/AdminSettings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Admin panel - hidden route */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/requests" element={<SignupRequests />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/roles" element={<RolesPermissions />} />
            <Route path="/admin/activity" element={<SystemActivity />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>

          {/* User app */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-expense" element={<AddExpense />} />
            <Route path="/add-income" element={<AddIncome />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
