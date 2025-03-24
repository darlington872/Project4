import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { AlertCircle, Info } from "lucide-react";

// Nigerian banks
const NIGERIAN_BANKS = [
  "Access Bank",
  "Citibank",
  "Ecobank",
  "Fidelity Bank",
  "First Bank",
  "First City Monument Bank",
  "Guaranty Trust Bank",
  "Heritage Bank",
  "Keystone Bank",
  "Polaris Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "Union Bank",
  "United Bank for Africa",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank",
].sort();

// Form schema
const withdrawalSchema = z.object({
  amount: z
    .number({ required_error: "Amount is required" })
    .min(15000, "Minimum withdrawal amount is ₦15,000"),
  bankName: z.string({ required_error: "Bank name is required" }),
  accountNumber: z
    .string({ required_error: "Account number is required" })
    .length(10, "Account number must be 10 digits"),
  accountName: z.string({ required_error: "Account name is required" }),
  bypassed: z.boolean().default(false),
});

type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

export default function WithdrawalForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showBypassDialog, setShowBypassDialog] = useState(false);
  
  // Fetch settings to get minimum referrals
  const { data: settings } = useQuery({
    queryKey: ["/api/admin/settings"],
  });
  
  // Fetch referrals
  const { data: referrals = [] } = useQuery({
    queryKey: ["/api/referrals"],
  });
  
  // Calculate if user meets requirements
  const minReferrals = settings?.find(s => s.key === "minimumReferralsForWithdrawal")?.value || "20";
  const bypassFee = settings?.find(s => s.key === "withdrawalBypassFee")?.value || "2500";
  const hasEnoughReferrals = referrals.length >= parseInt(minReferrals);
  
  // Create form
  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 15000,
      bankName: user?.bankName || "",
      accountNumber: user?.accountNumber || "",
      accountName: user?.accountName || "",
      bypassed: false,
    },
  });
  
  // Withdrawal mutation
  const withdrawalMutation = useMutation({
    mutationFn: async (values: WithdrawalFormValues) => {
      const res = await apiRequest("POST", "/api/withdrawals", values);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request has been successfully submitted for processing.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Bypass payment mutation
  const bypassMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments", {
        type: "withdrawal_bypass",
        amount: parseInt(bypassFee),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bypass Payment Submitted",
        description: "Your payment request has been submitted. Once approved, you'll be able to withdraw.",
      });
      setShowBypassDialog(false);
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
  
  const onSubmit = (values: WithdrawalFormValues) => {
    if (!hasEnoughReferrals && !values.bypassed) {
      setShowBypassDialog(true);
      return;
    }
    
    withdrawalMutation.mutate(values);
  };
  
  const handleBypassPayment = () => {
    bypassMutation.mutate();
  };
  
  return (
    <>
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Withdraw Funds</CardTitle>
          <CardDescription>
            Withdraw your earnings to your Nigerian bank account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!hasEnoughReferrals && (
            <Alert className="mb-6 bg-yellow-500/10 text-yellow-500 border-yellow-500/50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Referral Requirement</AlertTitle>
              <AlertDescription>
                You need at least {minReferrals} referrals to withdraw. 
                You currently have {referrals.length} referrals.
                You can bypass this requirement for a fee of ₦{parseInt(bypassFee).toLocaleString()}.
              </AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₦)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum withdrawal: ₦15,000 <br />
                      Fee: ₦100 per withdrawal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your bank" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NIGERIAN_BANKS.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter 10-digit account number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter account name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Alert className="bg-muted">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Total amount to be withdrawn: ₦{(form.watch('amount') + 100).toLocaleString()} 
                  (including ₦100 fee)
                </AlertDescription>
              </Alert>
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={withdrawalMutation.isPending}
          >
            {withdrawalMutation.isPending ? "Processing..." : "Submit Withdrawal Request"}
          </Button>
        </CardFooter>
      </Card>
      
      <AlertDialog open={showBypassDialog} onOpenChange={setShowBypassDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Referral Requirement Not Met</AlertDialogTitle>
            <AlertDialogDescription>
              You need at least {minReferrals} referrals to withdraw, but you only have {referrals.length}.
              Would you like to bypass this requirement by paying a fee of ₦{parseInt(bypassFee).toLocaleString()}?
              <br /><br />
              <strong>Payment Instructions:</strong><br />
              Pay ₦{parseInt(bypassFee).toLocaleString()} to:
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Account: 8121320468</li>
                <li>Bank: Opay</li>
                <li>Name: Keno Darlington</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBypassPayment} disabled={bypassMutation.isPending}>
              {bypassMutation.isPending ? "Processing..." : "Submit Payment Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
