
import { Route, Switch } from "wouter";
import { ProtectedRoute } from "./lib/protected-route";
import AuthPage from "./pages/auth-page";
import Dashboard from "./pages/dashboard"; 
import Tasks from "./pages/tasks";
import Calendar from "./pages/calendar";
import Resources from "./pages/resources";
import Analytics from "./pages/analytics";
import NotFound from "./pages/not-found";
import { Sidebar } from "./components/layout/sidebar";
import { MobileNav } from "./components/layout/mobile-nav";
import { useIsMobile } from "./hooks/use-mobile";
import { useAuth } from "./hooks/use-auth";

export default function App() {
  const isMobile = useIsMobile();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {user && (
        <>
          {isMobile ? <MobileNav /> : <Sidebar />}
        </>
      )}
      
      <main className={`flex min-h-screen flex-col ${user ? (isMobile ? "pt-16" : "lg:pl-64") : ""}`}>
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <ProtectedRoute path="/" component={Dashboard} />
          <ProtectedRoute path="/tasks" component={Tasks} />
          <ProtectedRoute path="/calendar" component={Calendar} />
          <ProtectedRoute path="/resources" component={Resources} />
          <ProtectedRoute path="/analytics" component={Analytics} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}
