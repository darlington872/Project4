import DashboardLayout from "@/components/layout/dashboard-layout";
import PaymentsTable from "@/components/admin/payments-table";
import AdvertisementsTable from "@/components/admin/advertisements-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Payment, Advertisement } from "@shared/schema";

export default function AdminApprovalsPage() {
  // Fetch payments
  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
  });
  
  // Fetch advertisements
  const { data: advertisements = [] } = useQuery<Advertisement[]>({
    queryKey: ["/api/admin/advertisements"],
  });
  
  // Calculate stats
  const pendingPayments = payments.filter(p => p.status === "pending").length;
  const pendingAds = advertisements.filter(a => a.status === "pending").length;
  
  // Calculate payment types
  const contactGainPayments = payments.filter(p => p.type === "contact_gain").length;
  const advertisementPayments = payments.filter(p => p.type === "advertisement").length;
  const bypassPayments = payments.filter(p => p.type === "withdrawal_bypass").length;
  
  // Calculate payment amounts
  const paymentsAmount = payments
    .filter(p => p.status === "approved")
    .reduce((total, p) => total + p.amount, 0);

  return (
    <DashboardLayout title="Manage Approvals">
      <div className="py-6 space-y-8">
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPayments}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Ads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingAds}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{paymentsAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From approved payments</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Payment Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contact Gain:</span>
                  <span>{contactGainPayments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Advertisement:</span>
                  <span>{advertisementPayments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Withdrawal Bypass:</span>
                  <span>{bypassPayments}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="payments" className="w-full">
              <div className="border-b px-4">
                <TabsList className="justify-start">
                  <TabsTrigger value="payments">Payment Requests</TabsTrigger>
                  <TabsTrigger value="advertisements">Advertisements</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="payments" className="p-4 pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Payment Requests</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Manage user payment requests for Contact Gain, Advertisement, and Withdrawal Bypass
                    </p>
                  </div>
                  
                  <PaymentsTable />
                </div>
              </TabsContent>
              
              <TabsContent value="advertisements" className="p-4 pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Advertisement Submissions</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Review and approve user advertisement submissions
                    </p>
                  </div>
                  
                  <AdvertisementsTable />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
