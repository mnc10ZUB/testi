import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { Calendar, Car, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export default function Sidebar() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  // Filter Menüpunkte für den Benutzer "Zubbrandenburg" - dieser soll nur den Kalender sehen
  let navItems = [
    { href: "/", label: t('nav.calendar'), icon: Calendar }
  ];
  
  // Für alle anderen Benutzer zeigen wir alle Menüpunkte an
  if (!user || user.username !== "Zubbrandenburg") {
    navItems = [
      { href: "/", label: t('nav.calendar'), icon: Calendar },
      { href: "/vehicles", label: t('nav.vehicles'), icon: Car },
      { href: "/admin", label: t('nav.users'), icon: Users },
      { href: "/settings", label: t('nav.settings'), icon: Settings },
    ];
  }

  return (
    <aside className="w-full md:w-64 bg-white shadow-md">
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href}>
                <a 
                  className={cn(
                    "flex items-center px-4 py-2 rounded",
                    isActive(href) 
                      ? "text-white bg-primary hover:bg-primary-dark" 
                      : "text-neutral-dark hover:bg-neutral-lightest"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  <span>{label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
