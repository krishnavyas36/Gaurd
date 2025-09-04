import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import ComplianceFilter from "@/pages/ComplianceFilter";
import LLMTesting from "@/pages/LLMTesting";
import AlertsPage from "@/pages/AlertsPage";
import ProfilePage from "@/pages/ProfilePage";
import ReportsPage from "@/pages/ReportsPage";
import CompliancePage from "@/pages/CompliancePage";
import MonitoringControlPage from "@/pages/MonitoringControlPage";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/compliance" component={ComplianceFilter} />
          <Route path="/advanced-compliance" component={CompliancePage} />
          <Route path="/monitoring-control" component={MonitoringControlPage} />
          <Route path="/llm-testing" component={LLMTesting} />
          <Route path="/alerts" component={AlertsPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/reports" component={ReportsPage} />
        </>
      )}
      <Route path="/landing" component={Landing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
