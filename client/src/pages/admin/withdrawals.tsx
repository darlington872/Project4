import DashboardLayout from "@/components/layout/dashboard-layout";
import WithdrawalsTable from "@/components/admin/withdrawals-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Withdrawal } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";

export default function AdminWithdrawalsPage() {
  // Fetch withdrawals
  const { data: withdrawals = [] } = useQuery<Withdrawal[]>({
    queryKey: ["/api/admin/withdrawals"],
  });
  
  // Calculate stats
  const totalWithdrawals = withdrawals.length;
  const pendingWithdrawals = withdrawals.filter(w => w.status === "pending").length;
  const approvedWithdrawals = withdrawals.filter(w => w.status === "approved").length;
  const rejectedWithdrawals = withdrawals.filter(w => w.status === "rejected").length;
  
  // Calculate total withdrawn amount
  const totalWithdrawnAmount = withdrawals
    .filter(w => w.status === "approved")
    .reduce((total, w) => total + w.amount, 0);
  
  // Calculate withdrawal fees collected
  const totalFees = withdrawals
    .filter(w => w.status === "approved")
    .reduce((total, w) => total + w.fee, 0);
    
  // Create chart data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateString = format(date, "yyyy-MM-dd");
    
    // Filter withdrawals for this day
    const dayWithdrawals = withdrawals.filter(w => 
      format(new Date(w.createdAt), "yyyy-MM-dd") === dateString
    );
    
    const approved = dayWithdrawals.filter(w => w.status === "approved").length;
    const pending = dayWithdrawals.filter(w => w.status === "pending").length;
    const rejected = dayWithdrawals.filter(w => w.status === "rejected").length;
    
    return {
      date: format(date, "MMM dd"),
      approved,
      pending,
      rejected,
      total: dayWithdrawals.length,
    };
  });

  return (
    <DashboardLayout title="Manage Withdrawals">
      <div className="py-6 space-y-8">
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWithdrawals}</div>
              <p className="text-xs text-muted-foreground">All-time withdrawal requests</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingWithdrawals}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{totalWithdrawnAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{approvedWithdrawals} approved withdrawals</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Fees Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{totalFees.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From withdrawal fees</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Trends</CardTitle>
            <CardDescription>
              Withdrawal activity over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={last7Days}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    name="Total"
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="approved" 
                    name="Approved"
                    stroke="#4ade80" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pending" 
                    name="Pending"
                    stroke="#eab308" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rejected" 
                    name="Rejected"
                    stroke="#f43f5e" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>All Withdrawals</CardTitle>
            <CardDescription>
              Manage user withdrawal requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WithdrawalsTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
