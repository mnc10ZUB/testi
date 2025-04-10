import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useLocation } from "wouter";
import { Redirect } from "wouter";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Benutzername ist erforderlich"),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, isLoading, loginMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [, navigate] = useLocation();

  // Form Setup - muss vor allen bedingten Rückgaben erfolgen
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  // Redirect to home if user is logged in (muss nach allen Hooks kommen)
  if (user && !isLoading) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left column - Auth form */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">ZUB Carpool Brandenburg</h1>
            <p className="text-muted-foreground mt-2">
              Melden Sie sich an, um auf die Fahrzeugverwaltung zuzugreifen
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-1 w-full">
              <TabsTrigger value="login">Anmelden</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Anmelden</CardTitle>
                  <CardDescription>
                    Geben Sie Ihre Zugangsdaten ein, um sich anzumelden
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Benutzername</FormLabel>
                            <FormControl>
                              <Input placeholder="Benutzername" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Passwort</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Passwort"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Anmelden...
                          </>
                        ) : (
                          "Anmelden"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center text-sm text-muted-foreground">
                  Kontaktieren Sie den Administrator, wenn Sie Probleme bei der Anmeldung haben.
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right column - Hero section */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-primary text-primary-foreground p-12">
        <div className="max-w-lg space-y-6">
          <h1 className="text-4xl font-bold tracking-tight">
            Fahrzeugverwaltung für ZUB Brandenburg
          </h1>
          <p className="text-xl">
            Reservieren Sie Fahrzeuge, planen Sie Ihre Fahrten und verwalten Sie Ihr Team
            effizient mit unserem Carpool-Management-System.
          </p>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-primary-foreground mr-2"></div>
              <p>Übersichtlicher Kalender für die Fahrzeugplanung</p>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-primary-foreground mr-2"></div>
              <p>Einfaches Reservierungssystem</p>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-primary-foreground mr-2"></div>
              <p>Administrative Funktionen für Fahrzeugverwaltung</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}