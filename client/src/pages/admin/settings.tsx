import DashboardLayout from "@/components/layout/dashboard-layout";
import SettingsForm from "@/components/admin/settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function AdminSettingsPage() {
  // Fetch settings
  const { data: settings = [] } = useQuery({
    queryKey: ["/api/admin/settings"],
  });
  
  // Get maintenance mode status
  const maintenanceMode = settings.find(s => s.key === "maintenanceMode")?.value === "true";

  return (
    <DashboardLayout title="Settings">
      <div className="py-6 space-y-8">
        {maintenanceMode && (
          <Alert className="bg-yellow-500/10 text-yellow-500 border-yellow-500/50">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Maintenance Mode Active</AlertTitle>
            <AlertDescription>
              The platform is currently in maintenance mode. Regular users cannot access the system.
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Platform Settings</CardTitle>
            <CardDescription>
              Configure all platform parameters and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Technical information about the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 items-center gap-4">
                <p className="text-sm font-medium">System Version</p>
                <p className="text-sm text-muted-foreground">1.0.0</p>
              </div>
              
              <div className="grid grid-cols-2 items-center gap-4">
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
              </div>
              
              <div className="grid grid-cols-2 items-center gap-4">
                <p className="text-sm font-medium">Database Type</p>
                <p className="text-sm text-muted-foreground">PostgreSQL</p>
              </div>
              
              <div className="grid grid-cols-2 items-center gap-4">
                <p className="text-sm font-medium">Storage Type</p>
                <p className="text-sm text-muted-foreground">In-Memory Storage (Development)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
