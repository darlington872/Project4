import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ContactGainForm from "@/components/contact-gain/contact-gain-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, MessageSquare, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function ContactGainPage() {
  const { user } = useAuth();
  
  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: ["/api/admin/settings"],
  });
  
  // Fetch referrals
  const { data: referrals = [] } = useQuery({
    queryKey: ["/api/referrals"],
  });
  
  // Get contact gain fee and required referrals
  const contactGainFee = settings?.find(s => s.key === "contactGainFee")?.value || "2000";
  const requiredReferrals = settings?.find(s => s.key === "referralsForContactGain")?.value || "15";

  return (
    <DashboardLayout title="Contact Gain">
      <div className="py-6">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                What is Contact Gain?
              </CardTitle>
              <CardDescription>
                Unlock premium features and enhance your earning potential
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Contact Gain is a premium membership status that gives you access to additional features
                and benefits on ReferPay. It helps you maximize your earning potential and provides you with
                exclusive opportunities.
              </p>
              
              <div className="space-y-3 mt-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-green-500/20 p-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Premium Support</p>
                    <p className="text-sm text-muted-foreground">Get priority support and assistance</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-green-500/20 p-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Higher Referral Visibility</p>
                    <p className="text-sm text-muted-foreground">Your referral link gets better placement in the system</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-green-500/20 p-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Exclusive Opportunities</p>
                    <p className="text-sm text-muted-foreground">Get access to special earning opportunities</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                How to Activate
              </CardTitle>
              <CardDescription>
                Two easy ways to activate Contact Gain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="refer" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="refer">Refer Friends</TabsTrigger>
                  <TabsTrigger value="pay">Make Payment</TabsTrigger>
                </TabsList>
                <TabsContent value="refer" className="mt-4 space-y-4">
                  <p className="text-muted-foreground">
                    Refer at least {requiredReferrals} friends to ReferPay and get Contact Gain activated automatically.
                    You currently have {referrals.length} referrals.
                  </p>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Progress</p>
                    <div className="h-2 bg-muted-foreground/20 rounded-full mb-2">
                      <div 
                        className="h-2 bg-primary rounded-full"
                        style={{ width: `${Math.min(100, (referrals.length / parseInt(requiredReferrals)) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {referrals.length} / {requiredReferrals} referrals
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="pay" className="mt-4 space-y-4">
                  <p className="text-muted-foreground">
                    Make a one-time payment of ₦{parseInt(contactGainFee).toLocaleString()} to activate Contact Gain immediately.
                  </p>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Payment Details</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Amount:</span> ₦{parseInt(contactGainFee).toLocaleString()}</p>
                      <p><span className="text-muted-foreground">Account:</span> 8121320468</p>
                      <p><span className="text-muted-foreground">Bank:</span> Opay</p>
                      <p><span className="text-muted-foreground">Name:</span> Keno Darlington</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <ContactGainForm />
      </div>
    </DashboardLayout>
  );
}
