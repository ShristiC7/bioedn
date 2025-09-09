import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/Dashboard";
import InteractiveMap from "@/pages/InteractiveMap";
import SampleUpload from "@/pages/SampleUpload";
import FileConverter from "@/pages/FileConverter";
import SpeciesAlerts from "@/pages/SpeciesAlerts";
import PredictiveAnalytics from "@/pages/PredictiveAnalytics";
import CitizenScience from "@/pages/CitizenScience";
import LiveActivity from "@/pages/LiveActivity";
import SpeciesDatabase from "@/pages/SpeciesDatabase";
import Landing from "@/pages/Landing";
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
          <Route path="/map" component={InteractiveMap} />
          <Route path="/upload" component={SampleUpload} />
          <Route path="/converter" component={FileConverter} />
          <Route path="/alerts" component={SpeciesAlerts} />
          <Route path="/predictions" component={PredictiveAnalytics} />
          <Route path="/citizens" component={CitizenScience} />
          <Route path="/activity" component={LiveActivity} />
          <Route path="/species" component={SpeciesDatabase} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthenticatedApp style={style} />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AuthenticatedApp({ style }: { style: any }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return <Router />;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-2 border-b border-border bg-background/80 backdrop-blur-sm">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                Real-time Marine Biodiversity Analytics
              </div>
              <UserMenu />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-hidden bg-background">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default App;
