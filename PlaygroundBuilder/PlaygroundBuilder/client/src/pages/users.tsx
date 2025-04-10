import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "../hooks/use-toast";

const registerSchema = z.object({
  username: z.string().min(3, "Benutzername muss mindestens 3 Zeichen haben"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen haben"),
  isAdmin: z.boolean().default(false),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Users() {
  const { user, registerMutation } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Benutzer laden
  const { data: users = [], refetch: refetchUsers } = useQuery<User[], Error>({
    queryKey: ["/api/users"],
    refetchInterval: 30000, // Alle 30 Sekunden aktualisieren
  });

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      isAdmin: false,
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        form.reset();
        refetchUsers();
      },
    });
  };

  const handleDeleteUser = async (userId: number) => {
    if (!userId) return;

    setIsDeleting(true);
    try {
      const response = await apiRequest("DELETE", `/api/users/${userId}`);
      
      if (response.ok) {
        toast({
          title: t("admin.users.deletedSuccess"),
          description: t("admin.users.deletedSuccessDesc"),
        });
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || t("admin.users.deleteError"));
      }
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || t("admin.users.deleteError"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  // Wenn der Benutzer kein Admin ist, oder noch nicht authentifiziert ist
  if (!user?.isAdmin) {
    return <div className="py-4 text-center text-muted-foreground">
      {t("admin.notAuthorized")}
    </div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Benutzer erstellen */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium">{t("admin.users.createNew")}</h3>
          
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.users.username")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("admin.users.usernamePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.users.password")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t("admin.users.passwordPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isAdmin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t("admin.users.isAdmin")}
                      </FormLabel>
                      <FormDescription>
                        {t("admin.users.isAdminDesc")}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.creating")}
                  </>
                ) : (
                  t("admin.users.create")
                )}
              </Button>
            </form>
          </Form>
        </div>

        {/* Benutzerliste */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium">{t("admin.users.listTitle")}</h3>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.users.username")}</TableHead>
                <TableHead>{t("admin.users.role")}</TableHead>
                <TableHead className="w-[100px]">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    {t("admin.users.noUsers")}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((userItem) => (
                  <TableRow key={userItem.id}>
                    <TableCell className="font-medium">
                      {userItem.username}
                    </TableCell>
                    <TableCell>
                      {userItem.isAdmin ? t("admin.users.adminRole") : t("admin.users.userRole")}
                    </TableCell>
                    <TableCell>
                      <AlertDialog
                        open={isDeleteDialogOpen && userToDelete?.id === userItem.id}
                        onOpenChange={(open) => {
                          setIsDeleteDialogOpen(open);
                          if (!open) setUserToDelete(null);
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setUserToDelete(userItem);
                              setIsDeleteDialogOpen(true);
                            }}
                            disabled={userItem.id === user.id} // Eigenen Benutzer kann man nicht löschen
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("admin.users.deleteTitle")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("admin.users.deleteConfirmation", { username: userItem.username })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(userItem.id)}
                              disabled={isDeleting}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeleting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {t("common.deleting")}
                                </>
                              ) : (
                                t("common.delete")
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}