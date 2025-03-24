import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2Icon } from "lucide-react";
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

type Setting = {
  id: number;
  key: string;
  value: string;
  updatedAt: Date;
};

type SettingUpdate = {
  key: string;
  value: string;
};

export default function SettingsForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);

  // Fetch settings
  const { data: settings = [], isLoading } = useQuery<Setting[]>({
    queryKey: ["/api/admin/settings"],
  });
  
  // Set maintenance mode from settings
  React.useEffect(() => {
    if (settings && settings.length > 0) {
      const maintenanceSetting = settings.find((s) => s.key === "maintenanceMode");
      if (maintenanceSetting) {
        setMaintenanceEnabled(maintenanceSetting.value === "true");
      }
    }
  }, [settings]);

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: SettingUpdate) => {
      const res = await apiRequest("PATCH", `/api/admin/settings/${key}`, { value });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Setting Updated",
        description: "The setting has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Maintenance mode mutation
  const maintenanceMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("POST", "/api/admin/maintenance", { enabled });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: `Maintenance Mode ${data.enabled ? "Enabled" : "Disabled"}`,
        description: `Maintenance mode has been ${data.enabled ? "enabled" : "disabled"} successfully.`,
      });
      setMaintenanceEnabled(data.enabled);
      setShowMaintenanceDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle setting update
  const handleUpdateSetting = (key: string, value: string) => {
    updateSettingMutation.mutate({ key, value });
  };

  // Handle maintenance mode toggle
  const handleMaintenanceToggle = () => {
    setShowMaintenanceDialog(true);
  };

  // Confirm maintenance mode change
  const confirmMaintenanceChange = () => {
    maintenanceMutation.mutate(!maintenanceEnabled);
  };

  // Get setting value
  const getSettingValue = (key: string) => {
    const setting = settings.find(s => s.key === key);
    return setting ? setting.value : "";
  };

  // Setting display helpers
  const getSettingDisplay = (key: string) => {
    switch (key) {
      case "referralAmount":
        return "Referral Amount (₦)";
      case "minimumWithdrawal":
        return "Minimum Withdrawal (₦)";
      case "withdrawalFee":
        return "Withdrawal Fee (₦)";
      case "minimumReferralsForWithdrawal":
        return "Minimum Referrals for Withdrawal";
      case "withdrawalBypassFee":
        return "Withdrawal Bypass Fee (₦)";
      case "contactGainFee":
        return "Contact Gain Fee (₦)";
      case "referralsForContactGain":
        return "Referrals for Contact Gain";
      case "advertisementFee":
        return "Advertisement Fee (₦)";
      case "dailyBonus":
        return "Daily Bonus (₦)";
      case "totalPayout":
        return "Total Payout (₦)";
      default:
        return key;
    }
  };

  // Filter out settings that shouldn't be editable through the form
  const editableSettings = settings.filter(s => 
    s.key !== "maintenanceMode" && s.key !== "totalPayout"
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Maintenance Mode</CardTitle>
          <CardDescription>
            Enable or disable maintenance mode for the entire platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">
                When enabled, regular users will not be able to access the platform. 
                Only administrators will have access.
              </p>
            </div>
            <Switch
              checked={maintenanceEnabled}
              onCheckedChange={handleMaintenanceToggle}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform Settings</CardTitle>
          <CardDescription>
            Configure the platform settings and parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {editableSettings.map((setting) => (
              <div key={setting.key} className="grid grid-cols-2 items-center gap-4">
                <div>
                  <p className="text-sm font-medium">{getSettingDisplay(setting.key)}</p>
                  <p className="text-xs text-muted-foreground">
                    Current value: {setting.value}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    defaultValue={setting.value}
                    onChange={(e) => e.currentTarget.dataset.newValue = e.target.value}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      const input = document.querySelector(`input[value="${setting.value}"]`) as HTMLInputElement;
                      const newValue = input.dataset.newValue || input.value;
                      handleUpdateSetting(setting.key, newValue);
                    }}
                    disabled={updateSettingMutation.isPending}
                  >
                    {updateSettingMutation.isPending ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      "Update"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center text-sm text-muted-foreground">
            <p>
              Total Payout: <span className="font-semibold">₦{parseInt(getSettingValue("totalPayout")).toLocaleString()}</span>
            </p>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
              }}
            >
              Refresh Settings
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Maintenance Mode Dialog */}
      <AlertDialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {maintenanceEnabled ? "Disable" : "Enable"} Maintenance Mode
            </AlertDialogTitle>
            <AlertDialogDescription>
              {maintenanceEnabled
                ? "Are you sure you want to disable maintenance mode? This will allow all users to access the platform again."
                : "Are you sure you want to enable maintenance mode? This will prevent regular users from accessing the platform."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMaintenanceChange}
              className={maintenanceEnabled ? "" : "bg-yellow-500 text-white hover:bg-yellow-600"}
            >
              {maintenanceMutation.isPending ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                maintenanceEnabled ? "Disable Maintenance Mode" : "Enable Maintenance Mode"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
