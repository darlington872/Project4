import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import WithdrawalForm from "@/components/withdrawal/withdrawal-form";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Withdrawal } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function WithdrawPage() {
  // Fetch withdrawals
  const { data: withdrawals = [], isLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals"],
  });
  
  // Table columns
  const columns: ColumnDef<Withdrawal>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div>#{row.original.id}</div>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <div className="font-medium">
          ₦{row.original.amount.toLocaleString()}
          <span className="text-xs text-muted-foreground block">
            Fee: ₦{row.original.fee}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "bankDetails",
      header: "Bank Details",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{row.original.bankName}</div>
          <div>{row.original.accountNumber}</div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge className={
            status === "pending" ? "bg-yellow-500" :
            status === "approved" ? "bg-green-500" :
            "bg-destructive"
          }>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
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

  return (
    <DashboardLayout title="Withdraw Funds">
      <div className="py-6">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Clock className="h-5 w-5 mr-2 text-yellow-500" />
                Pending
              </CardTitle>
              <CardDescription>Waiting for approval</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {withdrawals.filter(w => w.status === "pending").length}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-green-500/10 border-green-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                Approved
              </CardTitle>
              <CardDescription>Successfully processed</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {withdrawals.filter(w => w.status === "approved").length}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-red-500/10 border-red-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                Rejected
              </CardTitle>
              <CardDescription>Declined withdrawals</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {withdrawals.filter(w => w.status === "rejected").length}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <WithdrawalForm />
        
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-6">Withdrawal History</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : withdrawals.length > 0 ? (
            <DataTable columns={columns} data={withdrawals} />
          ) : (
            <div className="text-center py-10 bg-card rounded-lg border border-border">
              <h3 className="text-lg font-medium mb-2">No Withdrawals Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                When you make a withdrawal request, it will appear here.
                Remember, you need at least ₦15,000 and 20+ referrals to withdraw.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
