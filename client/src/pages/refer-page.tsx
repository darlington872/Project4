import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ReferralLink from "@/components/referral/referral-link";
import HowItWorks from "@/components/referral/how-it-works";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

type ReferralWithUser = {
  id: number;
  referrerId: number;
  referredId: number;
  status: string;
  amount: number;
  createdAt: Date;
  referredUser: {
    id: number;
    username: string;
    createdAt: Date;
  } | null;
};

export default function ReferPage() {
  const { user } = useAuth();
  
  // Fetch referrals
  const { data: referrals = [], isLoading } = useQuery<ReferralWithUser[]>({
    queryKey: ["/api/referrals"],
  });
  
  // Table columns
  const columns: ColumnDef<ReferralWithUser>[] = [
    {
      accessorKey: "referredUser",
      header: "User",
      cell: ({ row }) => {
        const referredUser = row.original.referredUser;
        if (!referredUser) return <div>Unknown User</div>;
        
        const initial = referredUser.username.charAt(0).toUpperCase();
        
        return (
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-3">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm font-medium">{referredUser.username}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date Joined",
      cell: ({ row }) => {
        const referredUser = row.original.referredUser;
        if (!referredUser) return <div>-</div>;
        
        return (
          <div className="text-sm text-muted-foreground">
            {format(new Date(referredUser.createdAt), "MMM d, yyyy")}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        
        return (
          <Badge className={status === "active" ? "bg-green-500" : "bg-yellow-500"}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Earnings",
      cell: ({ row }) => (
        <div className="text-sm font-medium text-green-500">
          ₦{row.original.amount.toLocaleString()}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Refer & Earn">
      <div className="py-6">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <ReferralLink />
          <HowItWorks />
        </div>
        
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-6">Your Referrals</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : referrals.length > 0 ? (
            <DataTable columns={columns} data={referrals} />
          ) : (
            <div className="text-center py-10 bg-card rounded-lg border border-border">
              <h3 className="text-lg font-medium mb-2">No Referrals Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Share your referral link with friends and family. You'll earn ₦1,000 
                for each person who signs up using your link.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
