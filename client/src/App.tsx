import { Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ReferPage from "@/pages/refer-page";
import WithdrawPage from "@/pages/withdraw-page";
import AdvertisePage from "@/pages/advertise-page";
import ContactGainPage from "@/pages/contact-gain-page";
import MarketplacePage from "@/pages/marketplace-page";
import OrdersPage from "@/pages/orders-page";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminSettings from "@/pages/admin/settings";
import AdminWithdrawals from "@/pages/admin/withdrawals";
import AdminApprovals from "@/pages/admin/approvals";
import AdminMarketplace from "@/pages/admin/marketplace";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/refer" component={ReferPage} />
      <ProtectedRoute path="/withdraw" component={WithdrawPage} />
      <ProtectedRoute path="/advertise" component={AdvertisePage} />
      <ProtectedRoute path="/contact-gain" component={ContactGainPage} />
      <ProtectedRoute path="/marketplace" component={MarketplacePage} />
      <ProtectedRoute path="/orders" component={OrdersPage} />
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/admin/users" component={AdminUsers} />
      <ProtectedRoute path="/admin/settings" component={AdminSettings} />
      <ProtectedRoute path="/admin/withdrawals" component={AdminWithdrawals} />
      <ProtectedRoute path="/admin/approvals" component={AdminApprovals} />
      <ProtectedRoute path="/admin/marketplace" component={AdminMarketplace} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
