import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Payment } from "@shared/schema";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
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

export default function PaymentsTable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [paymentIdToAction, setPaymentIdToAction] = useState<number | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>("pending");

  // Fetch payments
  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments", { status: selectedStatus }],
  });

  // Update payment status mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/payments/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: `Payment ${action === "approve" ? "Approved" : "Rejected"}`,
        description: `The payment has been ${action === "approve" ? "approved" : "rejected"} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
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

  // Handle approve payment
  const handleApprovePayment = (id: number) => {
    setPaymentIdToAction(id);
    setAction("approve");
    setShowDialog(true);
  };

  // Handle reject payment
  const handleRejectPayment = (id: number) => {
    setPaymentIdToAction(id);
    setAction("reject");
    setShowDialog(true);
  };

  // Confirm action
  const confirmAction = () => {
    if (paymentIdToAction && action) {
      updatePaymentMutation.mutate({
        id: paymentIdToAction,
        status: action === "approve" ? "approved" : "rejected",
      });
    }
  };

  // Filter payments by status
  const handleStatusChange = (status: string | undefined) => {
    setSelectedStatus(status);
  };

  // Format payment type
  const formatPaymentType = (type: string) => {
    switch (type) {
      case "contact_gain":
        return "Contact Gain";
      case "advertisement":
        return "Advertisement";
      case "withdrawal_bypass":
        return "Withdrawal Bypass";
      default:
        return type;
    }
  };

  // Table columns
  const columns: ColumnDef<Payment>[] = [
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
      cell: ({ row }) => (
        <Badge className={
          row.original.type === "contact_gain" ? "bg-yellow-500" :
          row.original.type === "advertisement" ? "bg-blue-500" :
          "bg-purple-500"
        }>
          {formatPaymentType(row.original.type)}
        </Badge>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <div className="font-medium">₦{row.original.amount.toLocaleString()}</div>
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
        const payment = row.original;
        
        // Don't show action buttons for processed payments
        if (payment.status !== "pending") {
          return <div className="text-muted-foreground italic text-sm">Processed</div>;
        }
        
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20"
              onClick={() => handleApprovePayment(payment.id)}
              disabled={updatePaymentMutation.isPending}
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
              onClick={() => handleRejectPayment(payment.id)}
              disabled={updatePaymentMutation.isPending}
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
      
      <DataTable columns={columns} data={payments} />
      
      {/* Confirmation Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === "approve" ? "Approve Payment" : "Reject Payment"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === "approve"
                ? "Are you sure you want to approve this payment? This will activate the corresponding feature for the user."
                : "Are you sure you want to reject this payment? The user will need to submit a new payment request."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={action === "approve" ? "bg-green-500 text-white" : "bg-destructive text-destructive-foreground"}
            >
              {updatePaymentMutation.isPending ? (
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
