import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/index";
import FormPage from "@/pages/form";
import ResultPage from "@/pages/result";
import DashboardPage from "@/pages/dashboard";
import { AuthGuard } from "@/components/ui/AuthGuard";
import { Navbar } from "@/components/ui/Navbar";

function Router() {
  return (
    <>
      <Navbar />
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/form" component={FormPage} />
        <Route path="/result/:id" component={ResultPage} />
        <Route path="/dashboard">
          {() => (
            <AuthGuard>
              <DashboardPage />
            </AuthGuard>
          )}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;