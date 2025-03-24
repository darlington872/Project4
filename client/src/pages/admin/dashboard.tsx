import DashboardLayout from "@/components/layout/dashboard-layout";
import StatsCards from "@/components/admin/stats-cards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Withdrawal, Payment, Advertisement } from "@shared/schema";
import { Link } from "wouter";

// Schema for broadcast notifications
const broadcastSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
});

type BroadcastFormValues = z.infer<typeof broadcastSchema>;

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreatingBroadcast, setIsCreatingBroadcast] = useState(false);

  // Fetch pending items
  const { data: pendingWithdrawals = [] } = useQuery<Withdrawal[]>({
    queryKey: ["/api/admin/withdrawals", { status: "pending" }],
  });

  const { data: pendingPayments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments", { status: "pending" }],
  });

  const { data: pendingAds = [] } = useQuery<Advertisement[]>({
    queryKey: ["/api/admin/advertisements", { status: "pending" }],
  });

  // Broadcast form
  const broadcastForm = useForm<BroadcastFormValues>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      title: "",
      message: "",
    },
  });

  // Broadcast mutation
  const broadcastMutation = useMutation({
    mutationFn: async (values: BroadcastFormValues) => {
      const res = await apiRequest("POST", "/api/admin/broadcast", values);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Broadcast Sent",
        description: "Your message has been sent to all users.",
      });
      broadcastForm.reset();
      setIsCreatingBroadcast(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Broadcast Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle broadcast form submission
  const onBroadcastSubmit = (values: BroadcastFormValues) => {
    broadcastMutation.mutate(values);
  };

  // Withdrawal columns
  const withdrawalColumns: ColumnDef<Withdrawal>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div>#{row.original.id}</div>,
    },
    {
      accessorKey: "userId",
      header: "User",
      cell: ({ row }) => <div>#{row.original.userId}</div>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <div className="font-medium">₦{row.original.amount.toLocaleString()}</div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Requested",
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.createdAt), "MMM d, yyyy")}
        </div>
      ),
    },
  ];

  // Payments columns
  const paymentColumns: ColumnDef<Payment>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div>#{row.original.id}</div>,
    },
    {
      accessorKey: "userId",
      header: "User",
      cell: ({ row }) => <div>#{row.original.userId}</div>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.type;
        return (
          <Badge className={
            type === "contact_gain" ? "bg-yellow-500" :
            type === "advertisement" ? "bg-blue-500" :
            "bg-purple-500"
          }>
            {type === "contact_gain" ? "Contact Gain" :
             type === "advertisement" ? "Advertisement" :
             "Withdrawal Bypass"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <div className="font-medium">₦{row.original.amount.toLocaleString()}</div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="py-6 space-y-8">
        <StatsCards />
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                Items requiring your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Withdrawals</p>
                    <p className="text-sm text-muted-foreground">
                      {pendingWithdrawals.length} pending requests
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/withdrawals">
                      <a>View All</a>
                    </Link>
                  </Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Payments</p>
                    <p className="text-sm text-muted-foreground">
                      {pendingPayments.length} pending requests
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/approvals">
                      <a>View All</a>
                    </Link>
                  </Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Advertisements</p>
                    <p className="text-sm text-muted-foreground">
                      {pendingAds.length} pending requests
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/approvals">
                      <a>View All</a>
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Broadcast Message</CardTitle>
              <CardDescription>
                Send announcements to all users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCreatingBroadcast ? (
                <Form {...broadcastForm}>
                  <form onSubmit={broadcastForm.handleSubmit(onBroadcastSubmit)} className="space-y-4">
                    <FormField
                      control={broadcastForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Announcement title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={broadcastForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Write your announcement here..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreatingBroadcast(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={broadcastMutation.isPending}
                      >
                        {broadcastMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Broadcast"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px]">
                  <p className="text-muted-foreground mb-4">
                    Send announcements, news, and updates to all users.
                  </p>
                  <Button onClick={() => setIsCreatingBroadcast(true)}>
                    Create New Broadcast
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Withdrawal Requests</CardTitle>
              <CardDescription>
                Latest pending withdrawals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingWithdrawals.length > 0 ? (
                <DataTable 
                  columns={withdrawalColumns} 
                  data={pendingWithdrawals.slice(0, 5)} 
                  pageSize={5}
                />
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  No pending withdrawal requests
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Payment Requests</CardTitle>
              <CardDescription>
                Latest pending payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPayments.length > 0 ? (
                <DataTable 
                  columns={paymentColumns} 
                  data={pendingPayments.slice(0, 5)} 
                  pageSize={5}
                />
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  No pending payment requests
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
