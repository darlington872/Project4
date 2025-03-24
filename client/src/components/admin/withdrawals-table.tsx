import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Withdrawal } from "@shared/schema";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { CheckIcon, XIcon, Loader2Icon } from "lucide-react";
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

export default function WithdrawalsTable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [withdrawalIdToAction, setWithdrawalIdToAction] = useState<number | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>("pending");

  // Fetch withdrawals
  const { data: withdrawals = [], isLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/admin/withdrawals", { status: selectedStatus }],
  });

  // Update withdrawal status mutation
  const updateWithdrawalMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/withdrawals/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: `Withdrawal ${action === "approve" ? "Approved" : "Rejected"}`,
        description: `The withdrawal has been ${action === "approve" ? "approved" : "rejected"} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      setShowDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle approve withdrawal
  const handleApproveWithdrawal = (id: number) => {
    setWithdrawalIdToAction(id);
    setAction("approve");
    setShowDialog(true);
  };

  // Handle reject withdrawal
  const handleRejectWithdrawal = (id: number) => {
    setWithdrawalIdToAction(id);
    setAction("reject");
    setShowDialog(true);
  };

  // Confirm action
  const confirmAction = () => {
    if (withdrawalIdToAction && action) {
      updateWithdrawalMutation.mutate({
        id: withdrawalIdToAction,
        status: action === "approve" ? "approved" : "rejected",
      });
    }
  };

  // Filter withdrawals by status
  const handleStatusChange = (status: string | undefined) => {
    setSelectedStatus(status);
  };

  // Table columns
  const columns: ColumnDef<Withdrawal>[] = [
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
          <div className="text-muted-foreground">{row.original.accountName}</div>
        </div>
      ),
    },
    {
      accessorKey: "bypassed",
      header: "Bypass",
      cell: ({ row }) => (
        row.original.bypassed ? (
          <Badge className="bg-yellow-500">Bypassed</Badge>
        ) : (
          <Badge variant="outline">Regular</Badge>
        )
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
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const withdrawal = row.original;
        
        // Don't show action buttons for processed withdrawals
        if (withdrawal.status !== "pending") {
          return <div className="text-muted-foreground italic text-sm">Processed</div>;
        }
        
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20"
              onClick={() => handleApproveWithdrawal(withdrawal.id)}
              disabled={updateWithdrawalMutation.isPending}
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
              onClick={() => handleRejectWithdrawal(withdrawal.id)}
              disabled={updateWithdrawalMutation.isPending}
            >
              <XIcon className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2 mb-4">
        <Button
          variant={selectedStatus === undefined ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusChange(undefined)}
        >
          All
        </Button>
        <Button
          variant={selectedStatus === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusChange("pending")}
        >
          Pending
        </Button>
        <Button
          variant={selectedStatus === "approved" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusChange("approved")}
        >
          Approved
        </Button>
        <Button
          variant={selectedStatus === "rejected" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusChange("rejected")}
        >
          Rejected
        </Button>
      </div>
      
      <DataTable columns={columns} data={withdrawals} />
      
      {/* Confirmation Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === "approve" ? "Approve Withdrawal" : "Reject Withdrawal"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === "approve"
                ? "Are you sure you want to approve this withdrawal? This action means the user has been paid and cannot be undone."
                : "Are you sure you want to reject this withdrawal? The amount will be refunded to the user's balance."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={action === "approve" ? "bg-green-500 text-white" : "bg-destructive text-destructive-foreground"}
            >
              {updateWithdrawalMutation.isPending ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                action === "approve" ? "Approve" : "Reject"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
