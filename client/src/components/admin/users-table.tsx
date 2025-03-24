import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { BanIcon, CheckIcon, Loader2Icon } from "lucide-react";
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

export default function UsersTable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [userIdToAction, setUserIdToAction] = useState<number | null>(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showUnbanDialog, setShowUnbanDialog] = useState(false);

  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Ban user mutation
  const banUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/ban`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "User Banned",
        description: "The user has been banned successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowBanDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Ban Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unban user mutation
  const unbanUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/unban`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "User Unbanned",
        description: "The user has been unbanned successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowUnbanDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Unban Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle ban user
  const handleBanUser = (userId: number) => {
    setUserIdToAction(userId);
    setShowBanDialog(true);
  };

  // Handle unban user
  const handleUnbanUser = (userId: number) => {
    setUserIdToAction(userId);
    setShowUnbanDialog(true);
  };

  // Confirm ban
  const confirmBan = () => {
    if (userIdToAction) {
      banUserMutation.mutate(userIdToAction);
    }
  };

  // Confirm unban
  const confirmUnban = () => {
    if (userIdToAction) {
      unbanUserMutation.mutate(userIdToAction);
    }
  };

  // Table columns
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "username",
      header: "Username",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.username}</div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div>{row.original.email}</div>,
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ row }) => (
        <div className="font-medium">₦{row.original.balance.toLocaleString()}</div>
      ),
    },
    {
      accessorKey: "referralCount",
      header: "Referrals",
      cell: ({ row }) => <div>{row.original.referralCount}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex flex-col gap-1">
            {user.isAdmin && (
              <Badge className="bg-blue-500">Admin</Badge>
            )}
            <Badge className={
              user.isBanned 
                ? "bg-destructive" 
                : "bg-green-500"
            }>
              {user.isBanned ? "Banned" : "Active"}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original;
        
        // Don't show action buttons for admin users
        if (user.isAdmin) {
          return <div className="text-muted-foreground italic text-sm">Admin User</div>;
        }
        
        return user.isBanned ? (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => handleUnbanUser(user.id)}
            disabled={unbanUserMutation.isPending && userIdToAction === user.id}
          >
            {unbanUserMutation.isPending && userIdToAction === user.id ? (
              <Loader2Icon className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <CheckIcon className="h-4 w-4 mr-1" />
            )}
            Unban
          </Button>
        ) : (
          <Button
            variant="destructive"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => handleBanUser(user.id)}
            disabled={banUserMutation.isPending && userIdToAction === user.id}
          >
            {banUserMutation.isPending && userIdToAction === user.id ? (
              <Loader2Icon className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <BanIcon className="h-4 w-4 mr-1" />
            )}
            Ban
          </Button>
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
      <DataTable columns={columns} data={users} />
      
      {/* Ban Confirmation Dialog */}
      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban this user? They will no longer be able to access their account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBan}
              className="bg-destructive text-destructive-foreground"
            >
              {banUserMutation.isPending ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                  Banning...
                </>
              ) : (
                "Ban User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Unban Confirmation Dialog */}
      <AlertDialog open={showUnbanDialog} onOpenChange={setShowUnbanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unban this user? They will regain access to their account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnban}
              className="bg-green-500 text-white"
            >
              {unbanUserMutation.isPending ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                  Unbanning...
                </>
              ) : (
                "Unban User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
