import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Advertisement } from "@shared/schema";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { CheckIcon, XIcon, Loader2Icon, Eye } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdvertisementsTable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [adIdToAction, setAdIdToAction] = useState<number | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>("pending");
  const [viewAd, setViewAd] = useState<Advertisement | null>(null);

  // Fetch advertisements
  const { data: advertisements = [], isLoading } = useQuery<Advertisement[]>({
    queryKey: ["/api/admin/advertisements", { status: selectedStatus }],
  });

  // Update advertisement status mutation
  const updateAdMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/advertisements/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: `Advertisement ${action === "approve" ? "Approved" : "Rejected"}`,
        description: `The advertisement has been ${action === "approve" ? "approved" : "rejected"} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
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

  // Handle approve advertisement
  const handleApproveAd = (id: number) => {
    setAdIdToAction(id);
    setAction("approve");
    setShowDialog(true);
  };

  // Handle reject advertisement
  const handleRejectAd = (id: number) => {
    setAdIdToAction(id);
    setAction("reject");
    setShowDialog(true);
  };

  // Handle view advertisement
  const handleViewAd = (ad: Advertisement) => {
    setViewAd(ad);
  };

  // Confirm action
  const confirmAction = () => {
    if (adIdToAction && action) {
      updateAdMutation.mutate({
        id: adIdToAction,
        status: action === "approve" ? "approved" : "rejected",
      });
    }
  };

  // Filter advertisements by status
  const handleStatusChange = (status: string | undefined) => {
    setSelectedStatus(status);
  };

  // Table columns
  const columns: ColumnDef<Advertisement>[] = [
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
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.title}</div>
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
      header: "Created",
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
        const ad = row.original;
        
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewAd(ad)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            
            {ad.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20"
                  onClick={() => handleApproveAd(ad.id)}
                  disabled={updateAdMutation.isPending}
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
                  onClick={() => handleRejectAd(ad.id)}
                  disabled={updateAdMutation.isPending}
                >
                  <XIcon className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
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
      
      <DataTable columns={columns} data={advertisements} />
      
      {/* Confirmation Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === "approve" ? "Approve Advertisement" : "Reject Advertisement"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === "approve"
                ? "Are you sure you want to approve this advertisement? It will be visible to all users."
                : "Are you sure you want to reject this advertisement? The user will need to submit a new advertisement."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={action === "approve" ? "bg-green-500 text-white" : "bg-destructive text-destructive-foreground"}
            >
              {updateAdMutation.isPending ? (
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
      
      {/* View Advertisement Dialog */}
      <Dialog open={viewAd !== null} onOpenChange={(open) => !open && setViewAd(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Advertisement Details</DialogTitle>
            <DialogDescription>
              Review the advertisement content below
            </DialogDescription>
          </DialogHeader>
          
          {viewAd && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Title</h3>
                <p className="mt-1 text-lg font-semibold">{viewAd.title}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="mt-1 whitespace-pre-wrap">{viewAd.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
                <p className="mt-1">{viewAd.contactInfo}</p>
              </div>
              
              <div className="bg-muted p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Status: </span>
                    <Badge className={
                      viewAd.status === "pending" ? "bg-yellow-500" :
                      viewAd.status === "approved" ? "bg-green-500" :
                      "bg-destructive"
                    }>
                      {viewAd.status.charAt(0).toUpperCase() + viewAd.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Created: </span>
                    {format(new Date(viewAd.createdAt), "MMM d, yyyy HH:mm")}
                  </div>
                </div>
              </div>
              
              {viewAd.status === "pending" && (
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    className="bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20"
                    onClick={() => handleApproveAd(viewAd.id)}
                    disabled={updateAdMutation.isPending}
                  >
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
                    onClick={() => handleRejectAd(viewAd.id)}
                    disabled={updateAdMutation.isPending}
                  >
                    <XIcon className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
