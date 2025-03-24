import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

// Form schema
const advertisementSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  contactInfo: z.string().min(5, "Contact information is required"),
});

type AdvertisementFormValues = z.infer<typeof advertisementSchema>;

export default function AdvertisementForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: ["/api/admin/settings"],
  });
  
  // Get advertisement fee
  const adFee = settings?.find(s => s.key === "advertisementFee")?.value || "3000";
  
  // Form setup
  const form = useForm<AdvertisementFormValues>({
    resolver: zodResolver(advertisementSchema),
    defaultValues: {
      title: "",
      description: "",
      contactInfo: "",
    },
  });
  
  // Create advertisement mutation
  const createAdMutation = useMutation({
    mutationFn: async (values: AdvertisementFormValues) => {
      const res = await apiRequest("POST", "/api/advertisements", values);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Advertisement Submitted",
        description: "Your advertisement has been submitted for approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/my-advertisements"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments", {
        type: "advertisement",
        amount: parseInt(adFee),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Request Submitted",
        description: "Your payment request has been submitted. Once approved, you can create advertisements.",
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
  
  const onSubmit = (values: AdvertisementFormValues) => {
    if (!user?.advertisementEnabled) {
      setShowPaymentDialog(true);
      return;
    }
    
    createAdMutation.mutate(values);
  };
  
  const handlePayment = () => {
    paymentMutation.mutate();
  };
  
  return (
    <>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create Advertisement</CardTitle>
          <CardDescription>
            Advertise your products or services to our community
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!user?.advertisementEnabled && (
            <Alert className="mb-6 bg-yellow-500/10 text-yellow-500 border-yellow-500/50">
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Advertisement Feature Not Activated</AlertTitle>
              <AlertDescription>
                You need to pay a one-time fee of ₦{parseInt(adFee).toLocaleString()} to activate the advertisement feature.
              </AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Advertisement Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a catchy title" {...field} />
                    </FormControl>
                    <FormDescription>
                      Keep it short and descriptive
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your product or service" 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide details about what you're offering
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contactInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Information</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number, email, or WhatsApp" {...field} />
                    </FormControl>
                    <FormDescription>
                      How potential customers can reach you
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={createAdMutation.isPending}
          >
            {createAdMutation.isPending ? "Submitting..." : "Submit Advertisement"}
          </Button>
        </CardFooter>
      </Card>
      
      <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Advertisement Feature Not Activated</AlertDialogTitle>
            <AlertDialogDescription>
              You need to pay a one-time fee of ₦{parseInt(adFee).toLocaleString()} to activate the advertisement feature.
              <br /><br />
              <strong>Payment Instructions:</strong><br />
              Pay ₦{parseInt(adFee).toLocaleString()} to:
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Account: 8121320468</li>
                <li>Bank: Opay</li>
                <li>Name: Keno Darlington</li>
              </ul>
              <br />
              Once your payment is approved, you'll be able to create advertisements.
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
