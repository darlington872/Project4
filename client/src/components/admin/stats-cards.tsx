import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, Users, Wallet, FileText, BanIcon, DollarSign } from "lucide-react";

export default function StatsCards() {
  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });
  
  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });
  
  // Fetch withdrawals
  const { data: withdrawals = [] } = useQuery({
    queryKey: ["/api/admin/withdrawals"],
  });
  
  // Fetch payments
  const { data: payments = [] } = useQuery({
    queryKey: ["/api/admin/payments"],
  });
  
  // Fetch advertisements
  const { data: advertisements = [] } = useQuery({
    queryKey: ["/api/admin/advertisements"],
  });
  
  // Calculate stats
  const totalUsers = users.length;
  const bannedUsers = users.filter(user => user.isBanned).length;
  const pendingWithdrawals = withdrawals.filter(w => w.status === "pending").length;
  const pendingPayments = payments.filter(p => p.status === "pending").length;
  const pendingAds = advertisements.filter(ad => ad.status === "pending").length;
  const totalPendingItems = pendingWithdrawals + pendingPayments + pendingAds;
  
  // Calculate total withdrawal amount (approved)
  const totalWithdrawnAmount = withdrawals
    .filter(w => w.status === "approved")
    .reduce((total, w) => total + w.amount, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            {bannedUsers > 0 && (
              <span className="flex items-center gap-1">
                <BanIcon className="h-3 w-3 text-destructive" />
                {bannedUsers} banned
              </span>
            )}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Payout</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₦{stats?.totalPayout.toLocaleString() || "0"}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <ArrowUpIcon className="h-3 w-3 text-green-500" />
            <span>₦{totalWithdrawnAmount.toLocaleString()} approved withdrawals</span>
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPendingItems}</div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>{pendingWithdrawals} withdrawals</p>
            <p>{pendingPayments} payments</p>
            <p>{pendingAds} advertisements</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Daily Bonus</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₦{stats?.dailyBonus || "500"}</div>
          <p className="text-xs text-muted-foreground">
            Current daily bonus amount
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
