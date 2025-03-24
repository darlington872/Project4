import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, CheckCircle2Icon, Users } from "lucide-react";

export default function ContactGainForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
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
  
  // Check if user meets the referral requirement
  const hasEnoughReferrals = referrals.length >= parseInt(requiredReferrals);
  
  // Contact gain activation mutation (using referrals)
  const activateContactGainMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/contact-gain");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Contact Gain Activated",
        description: "You have successfully activated the Contact Gain feature.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Activation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments", {
        type: "contact_gain",
        amount: parseInt(contactGainFee),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Request Submitted",
        description: "Your payment request has been submitted. Once approved, Contact Gain will be activated.",
      });
      setShowPaymentDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleActivate = () => {
    if (hasEnoughReferrals) {
      activateContactGainMutation.mutate();
    } else {
      setShowPaymentDialog(true);
    }
  };
  
  const handlePayment = () => {
    paymentMutation.mutate();
  };
  
  return (
    <>
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Contact Gain
          </CardTitle>
          <CardDescription>
            Activate Contact Gain to unlock premium features
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {user?.contactGainStatus === "active" ? (
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <CheckCircle2Icon className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-medium mb-2">Contact Gain is Active!</h3>
              <p className="text-muted-foreground">
                You have successfully activated Contact Gain and can access all its features.
              </p>
            </div>
          ) : (
            <>
              <Alert className="bg-background border-border">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Activate Contact Gain</AlertTitle>
                <AlertDescription>
                  You can activate Contact Gain by either:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Referring at least {requiredReferrals} people (You currently have {referrals.length})</li>
                    <li>Making a payment of ₦{parseInt(contactGainFee).toLocaleString()}</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-border">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-2">Refer {requiredReferrals} People</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      You currently have {referrals.length} out of {requiredReferrals} required referrals.
                    </p>
                    <div className="h-2 bg-muted rounded-full mb-4">
                      <div 
                        className="h-2 bg-primary rounded-full"
                        style={{ width: `${Math.min(100, (referrals.length / parseInt(requiredReferrals)) * 100)}%` }}
                      ></div>
                    </div>
                    <Button 
                      className="w-full"
                      disabled={!hasEnoughReferrals || activateContactGainMutation.isPending}
                      onClick={handleActivate}
                    >
                      {activateContactGainMutation.isPending ? "Activating..." : 
                       hasEnoughReferrals ? "Activate with Referrals" : `Need ${parseInt(requiredReferrals) - referrals.length} More Referrals`}
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="border-primary/30">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-2">Pay ₦{parseInt(contactGainFee).toLocaleString()}</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Make a one-time payment to activate Contact Gain immediately.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                      <li>Account: 8121320468</li>
                      <li>Bank: Opay</li>
                      <li>Name: Keno Darlington</li>
                    </ul>
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={() => setShowPaymentDialog(true)}
                      disabled={paymentMutation.isPending}
                    >
                      {paymentMutation.isPending ? "Processing..." : "Pay Now"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Contact Gain Payment</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to submit a payment request of ₦{parseInt(contactGainFee).toLocaleString()} to activate Contact Gain.
              <br /><br />
              <strong>Payment Instructions:</strong><br />
              Pay ₦{parseInt(contactGainFee).toLocaleString()} to:
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Account: 8121320468</li>
                <li>Bank: Opay</li>
                <li>Name: Keno Darlington</li>
              </ul>
              <br />
              Once your payment is approved, Contact Gain will be activated on your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePayment} disabled={paymentMutation.isPending}>
              {paymentMutation.isPending ? "Processing..." : "Submit Payment Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
