import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Nach erfolgreicher Authentifizierung zur Kalenderseite weiterleiten
  useEffect(() => {
    if (user) {
      setLocation("/calendar");
    }
  }, [user, setLocation]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Willkommen bei ZUB Carpool Brandenburg</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Sie werden weitergeleitet...
        </p>
      </div>
    </div>
  );
}