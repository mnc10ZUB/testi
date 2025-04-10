import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Vehicles from "./vehicles";
import Users from "./users";

export default function Admin() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
      
      <Tabs defaultValue="vehicles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vehicles">{t('admin.vehicles')}</TabsTrigger>
          <TabsTrigger value="reservations">{t('admin.reservations')}</TabsTrigger>
          <TabsTrigger value="users">{t('admin.users')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.vehicles')}</CardTitle>
              <CardDescription>
                Manage the vehicles in your fleet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Vehicles />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reservations">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.reservations')}</CardTitle>
              <CardDescription>
                View and manage all reservations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground py-4 text-center">
                This functionality will be implemented in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.users')}</CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Users />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
