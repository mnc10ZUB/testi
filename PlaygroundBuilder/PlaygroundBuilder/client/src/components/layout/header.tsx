import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Globe, User, ChevronDown, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "../../hooks/use-auth";

export default function Header() {
  const { t, i18n } = useTranslation();
  const { user, logoutMutation } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'de' ? 'en' : 'de';
    i18n.changeLanguage(newLanguage);
    setCurrentLanguage(newLanguage);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold font-heading">{t('app.title')}</h1>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="bg-opacity-20 bg-white hover:bg-opacity-30 text-white px-2 py-1 text-sm rounded"
            onClick={toggleLanguage}
          >
            <Globe className="h-4 w-4 mr-1" />
            {t('app.language')}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-4 flex items-center bg-opacity-20 bg-white hover:bg-opacity-30 text-white">
                <User className="h-4 w-4 mr-1" />
                <span className="mr-1">{user?.username || 'Benutzer'}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user?.isAdmin && (
                <DropdownMenuItem asChild>
                  <a href="/admin" className="cursor-pointer">Admin-Bereich</a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending} className="cursor-pointer text-destructive focus:text-destructive">
                {logoutMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Abmelden...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Abmelden
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
