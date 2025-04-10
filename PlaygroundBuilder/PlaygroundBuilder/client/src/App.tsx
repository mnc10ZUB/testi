import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { Suspense, lazy, useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import Header from "./components/layout/header";
import Sidebar from "./components/layout/sidebar";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

// Lazy load page components
const Calendar = lazy(() => import("@/pages/calendar"));
const Vehicles = lazy(() => import("@/pages/vehicles"));
const Admin = lazy(() => import("@/pages/admin"));
const AuthPage = lazy(() => import("@/pages/auth-page"));

// Loading component
const PageLoading = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-primary"></div>
  </div>
);

function Router() {
  const [location] = useLocation();
  
  // Set document title based on current route
  useEffect(() => {
    document.title = "ZUB Carpool Brandenburg";
  }, [location]);

  // Authentifizierte Routen haben Header und Sidebar
  const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-col md:flex-row flex-1">
        <Sidebar />
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  );

  return (
    <Suspense fallback={<PageLoading />}>
      <Switch>
        {/* Öffentliche Route */}
        <Route path="/auth" component={AuthPage} />
        
        {/* Geschützte Routen mit Layout */}
        <ProtectedRoute 
          path="/" 
          component={() => (
            <AuthenticatedLayout>
              <Calendar />
            </AuthenticatedLayout>
          )} 
        />
        <ProtectedRoute 
          path="/calendar" 
          component={() => (
            <AuthenticatedLayout>
              <Calendar />
            </AuthenticatedLayout>
          )} 
        />
        <ProtectedRoute 
          path="/vehicles" 
          component={() => (
            <AuthenticatedLayout>
              <Vehicles />
            </AuthenticatedLayout>
          )} 
        />
        <ProtectedRoute 
          path="/admin" 
          component={() => (
            <AuthenticatedLayout>
              <Admin />
            </AuthenticatedLayout>
          )} 
        />
        
        {/* 404-Seite */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

export default App;
