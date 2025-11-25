import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Dashboard from "@/pages/dashboard";
import Upload from "@/pages/upload";
import Assessment from "@/pages/assessment";
import History from "@/pages/history";
import Tracking from "@/pages/tracking";
import Chat from "@/pages/chat";
import SOS from "@/pages/sos";
import Hospitals from "@/pages/hospitals";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/upload" component={Upload} />
      <Route path="/assessment" component={Assessment} />
      <Route path="/chat" component={Chat} />
      <Route path="/sos" component={SOS} />
      <Route path="/hospitals" component={Hospitals} />
      <Route path="/history" component={History} />
      <Route path="/tracking" component={Tracking} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 min-w-0">
              <header className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-50">
                <div className="flex items-center gap-3">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <img 
                    src="/logo.jpeg" 
                    alt="HER metrix Logo" 
                    className="h-8 w-8 object-contain"
                    data-testid="logo-header"
                  />
                  <span className="font-semibold text-foreground hidden sm:inline">HER metrix</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-chart-2 animate-pulse" />
                  <span className="text-sm text-muted-foreground">AI-Powered Analysis</span>
                </div>
              </header>
              <main className="flex-1 overflow-auto bg-background">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
